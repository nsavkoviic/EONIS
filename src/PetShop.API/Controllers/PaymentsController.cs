using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetShop.Application.DTOs.Payment;
using PetShop.Application.Interfaces;
using PetShop.Infrastructure.Persistence;

namespace PetShop.API.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService                _paymentService;
    private readonly ILogger<PaymentsController>    _logger;
    private readonly AppDbContext                   _context;

    public PaymentsController(
        IPaymentService             paymentService,
        ILogger<PaymentsController> logger,
        AppDbContext                context)
    {
        _paymentService = paymentService;
        _logger         = logger;
        _context        = context;
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
    public async Task<IActionResult> Webhook()
    {
        Request.EnableBuffering();
        string payload;
        using (var reader = new StreamReader(
            Request.Body,
            encoding: System.Text.Encoding.UTF8,
            detectEncodingFromByteOrderMarks: false,
            leaveOpen: true))
        {
            payload = await reader.ReadToEndAsync();
        }

        var stripeSignature = Request.Headers["Stripe-Signature"]
            .FirstOrDefault() ?? string.Empty;

        _logger.LogInformation("Stripe webhook received. Signature present: {HasSignature}, Payload length: {Length}",
            !string.IsNullOrEmpty(stripeSignature), payload.Length);

        try
        {
            await _paymentService.HandleWebhookAsync(payload, stripeSignature);
            _logger.LogInformation("Stripe webhook handled successfully.");
        }
        catch (Exception ex)
        {
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

    /// <summary>Validate a discount code (Authenticated users).</summary>
    [Authorize]
    [HttpGet("validate-discount")]
    [ProducesResponseType(typeof(DiscountResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ValidateDiscount([FromQuery] string code)
    {
        var now = DateTime.UtcNow;

        var discount = await _context.DiscountCodes
            .FirstOrDefaultAsync(d =>
                d.Code.ToLower() == code.ToLower() &&
                d.IsActive &&
                (d.ExpiresAt == null || d.ExpiresAt > now) &&
                d.UsedCount < d.MaxUses);

        if (discount is null)
        {
            return Ok(new DiscountResultDto
            {
                IsValid  = false,
                Message  = "Invalid or expired discount code",
            });
        }

        return Ok(new DiscountResultDto
        {
            IsValid         = true,
            DiscountPercent = discount.DiscountPercent,
            Code            = discount.Code,
        });
    }

    // ── Admin Coupon Management ──────────────────────────────────────────────

    /// <summary>List all discount codes (Admin).</summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("discount-codes")]
    public async Task<IActionResult> GetDiscountCodes()
    {
        var codes = await _context.DiscountCodes
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new DiscountCodeDto
            {
                Id              = d.Id,
                Code            = d.Code,
                DiscountPercent = d.DiscountPercent,
                IsActive        = d.IsActive,
                MaxUses         = d.MaxUses,
                UsedCount       = d.UsedCount,
                ExpiresAt       = d.ExpiresAt,
                CreatedAt       = d.CreatedAt,
            })
            .ToListAsync();

        return Ok(codes);
    }

    /// <summary>Create a new discount code (Admin).</summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("discount-codes")]
    public async Task<IActionResult> CreateDiscountCode([FromBody] CreateDiscountCodeDto dto)
    {
        var exists = await _context.DiscountCodes.AnyAsync(d => d.Code.ToLower() == dto.Code.ToLower());
        if (exists) return BadRequest(new { detail = "A discount code with this name already exists." });

        var entity = new PetShop.Domain.Entities.DiscountCode
        {
            Code            = dto.Code.ToUpper(),
            DiscountPercent = dto.DiscountPercent,
            MaxUses         = dto.MaxUses,
            ExpiresAt       = dto.ExpiresAt,
            IsActive        = true,
        };

        _context.DiscountCodes.Add(entity);
        await _context.SaveChangesAsync();

        return Ok(new DiscountCodeDto
        {
            Id = entity.Id, Code = entity.Code, DiscountPercent = entity.DiscountPercent,
            IsActive = entity.IsActive, MaxUses = entity.MaxUses, UsedCount = entity.UsedCount,
            ExpiresAt = entity.ExpiresAt, CreatedAt = entity.CreatedAt,
        });
    }

    /// <summary>Update a discount code (Admin).</summary>
    [Authorize(Roles = "Admin")]
    [HttpPut("discount-codes/{id:guid}")]
    public async Task<IActionResult> UpdateDiscountCode(Guid id, [FromBody] UpdateDiscountCodeDto dto)
    {
        var entity = await _context.DiscountCodes.FindAsync(id);
        if (entity is null) return NotFound();

        if (dto.IsActive.HasValue) entity.IsActive = dto.IsActive.Value;
        if (dto.MaxUses.HasValue)  entity.MaxUses  = dto.MaxUses.Value;
        if (dto.ExpiresAt.HasValue) entity.ExpiresAt = dto.ExpiresAt.Value;

        await _context.SaveChangesAsync();
        return Ok(new DiscountCodeDto
        {
            Id = entity.Id, Code = entity.Code, DiscountPercent = entity.DiscountPercent,
            IsActive = entity.IsActive, MaxUses = entity.MaxUses, UsedCount = entity.UsedCount,
            ExpiresAt = entity.ExpiresAt, CreatedAt = entity.CreatedAt,
        });
    }

    /// <summary>Soft-delete a discount code (Admin).</summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("discount-codes/{id:guid}")]
    public async Task<IActionResult> DeleteDiscountCode(Guid id)
    {
        var entity = await _context.DiscountCodes.FindAsync(id);
        if (entity is null) return NotFound();

        entity.IsActive = false;
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
