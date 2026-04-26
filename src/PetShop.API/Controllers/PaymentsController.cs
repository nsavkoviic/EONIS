using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetShop.Application.DTOs.Payment;
using PetShop.Application.Interfaces;

namespace PetShop.API.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(IPaymentService paymentService, ILogger<PaymentsController> logger)
    {
        _paymentService = paymentService;
        _logger         = logger;
    }

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("User ID claim is missing."));

    /// <summary>Create a Stripe Checkout session for a pending order (Customer only).</summary>
    [Authorize(Roles = "Customer")]
    [HttpPost("checkout-session")]
    [ProducesResponseType(typeof(CheckoutSessionResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateCheckoutSession([FromBody] CreateCheckoutSessionDto dto)
    {
        var result = await _paymentService.CreateCheckoutSessionAsync(
            dto.OrderId,
            CurrentUserId,
            dto.SuccessUrl,
            dto.CancelUrl);

        return Ok(result);
    }

    /// <summary>
    /// Stripe webhook receiver. Always returns 200 to prevent retries for handled business errors.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("webhook")]
    [DisableRequestSizeLimit]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Webhook()
    {
        string payload;
        using (var reader = new StreamReader(Request.Body))
        {
            payload = await reader.ReadToEndAsync();
        }

        var stripeSignature = Request.Headers["Stripe-Signature"].FirstOrDefault() ?? string.Empty;

        try
        {
            await _paymentService.HandleWebhookAsync(payload, stripeSignature);
        }
        catch (Exception ex)
        {
            // Log but still return 200 — Stripe will otherwise retry indefinitely
            _logger.LogWarning(ex, "Stripe webhook handling encountered an error.");
        }

        return Ok(new { received = true });
    }

    /// <summary>Get all payment transactions with optional date range (Admin only).</summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("transactions")]
    [ProducesResponseType(typeof(IEnumerable<TransactionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTransactions(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to   = null)
    {
        var transactions = await _paymentService.GetAllTransactionsAsync(from, to);
        return Ok(transactions);
    }
}
