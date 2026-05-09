using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Stripe;
using Stripe.Checkout;
using PetShop.Application.DTOs.Payment;
using PetShop.Application.Interfaces;
using PetShop.Domain.Entities;
using PetShop.Domain.Enums;
using PetShop.Domain.Exceptions;
using PetShop.Infrastructure.Persistence;
using PetShop.Infrastructure.Settings;

namespace PetShop.Infrastructure.Services;

public class PaymentService : IPaymentService
{
    private readonly IPaymentRepository _paymentRepository;
    private readonly IOrderRepository   _orderRepository;
    private readonly StripeSettings     _stripeSettings;
    private readonly AppDbContext       _context;

    public PaymentService(
        IPaymentRepository      paymentRepository,
        IOrderRepository        orderRepository,
        IOptions<StripeSettings> stripeSettings,
        AppDbContext            context)
    {
        _paymentRepository = paymentRepository;
        _orderRepository   = orderRepository;
        _stripeSettings    = stripeSettings.Value;
        _context           = context;

        StripeConfiguration.ApiKey = _stripeSettings.SecretKey;
    }

    public async Task<CheckoutSessionResponseDto> CreateCheckoutSessionAsync(
        Guid orderId, Guid userId, string successUrl, string cancelUrl)
    {
        var order = await _orderRepository.GetWithItemsAsync(orderId)
            ?? throw new NotFoundException(nameof(Order), orderId);

        if (order.UserId != userId)
            throw new UnauthorizedException("You are not authorized to pay for this order.");

        if (order.Status != OrderStatus.Pending)
            throw new BadRequestException("Only pending orders can be checked out.");

        var lineItems = order.OrderItems.Select(oi => new SessionLineItemOptions
        {
            PriceData = new SessionLineItemPriceDataOptions
            {
                UnitAmountDecimal = oi.UnitPrice * 100,   // Stripe expects cents
                Currency          = "usd",
                ProductData       = new SessionLineItemPriceDataProductDataOptions
                {
                    Name    = oi.Product?.Name ?? "Product",
                    Images  = oi.Product?.ImageUrl is not null
                        ? new List<string> { oi.Product.ImageUrl }
                        : null,
                },
            },
            Quantity = oi.Quantity,
        }).ToList();

        var sessionOptions = new SessionCreateOptions
        {
            PaymentMethodTypes = new List<string> { "card" },
            LineItems          = lineItems,
            Mode               = "payment",
            SuccessUrl         = successUrl,
            CancelUrl          = cancelUrl,
            Metadata           = new Dictionary<string, string>
            {
                ["orderId"] = orderId.ToString(),
                ["userId"]  = userId.ToString(),
            },
        };

        var sessionService = new SessionService();
        var session = await sessionService.CreateAsync(sessionOptions);

        // Persist a pending payment record
        var payment = new Payment
        {
            OrderId         = orderId,
            StripeSessionId = session.Id,
            Amount          = order.TotalAmount,
            Currency        = "usd",
            Status          = PaymentStatus.Pending,
        };

        await _paymentRepository.AddAsync(payment);

        return new CheckoutSessionResponseDto
        {
            SessionId   = session.Id,
            CheckoutUrl = session.Url,
        };
    }

    public async Task HandleWebhookAsync(string payload, string stripeSignature)
    {
        Event stripeEvent;

        try
        {
            stripeEvent = EventUtility.ConstructEvent(
                payload, stripeSignature, _stripeSettings.WebhookSecret,
                throwOnApiVersionMismatch: false);
        }
        catch (StripeException ex)
        {
            throw new BadRequestException($"Webhook signature verification failed: {ex.Message}");
        }

        if (stripeEvent.Type == "checkout.session.completed")
        {
            var session = stripeEvent.Data.Object as Session;
            if (session is null) return;

            var payment = await _paymentRepository.GetByStripeSessionIdAsync(session.Id);
            if (payment is null) return;

            payment.Status                = PaymentStatus.Succeeded;
            payment.StripePaymentIntentId = session.PaymentIntentId;
            await _paymentRepository.UpdateAsync(payment);

            // Advance order status
            var order = await _orderRepository.GetByIdAsync(payment.OrderId);
            if (order is not null)
            {
                order.Status                = OrderStatus.Processing;
                order.StripePaymentIntentId = session.PaymentIntentId;
                order.StripeSessionId       = session.Id;
                await _orderRepository.UpdateAsync(order);

                // Clear cart — isolated so a failure here never rolls back payment/order
                try
                {
                    var cart = await _context.Carts
                        .Include(c => c.CartItems)
                        .FirstOrDefaultAsync(c => c.UserId == order.UserId);

                    if (cart is not null && cart.CartItems.Any())
                    {
                        _context.CartItems.RemoveRange(cart.CartItems);
                        await _context.SaveChangesAsync();
                    }
                }
                catch (Exception cartEx)
                {
                    Console.WriteLine($"[Webhook] Cart clear failed: {cartEx.Message}");
                }
            }
        }
        else if (stripeEvent.Type == "checkout.session.expired"
              || stripeEvent.Type == "payment_intent.payment_failed")
        {
            var session = stripeEvent.Data.Object as Session;
            if (session is null) return;

            var payment = await _paymentRepository.GetByStripeSessionIdAsync(session.Id);
            if (payment is null) return;

            payment.Status = PaymentStatus.Failed;
            await _paymentRepository.UpdateAsync(payment);
        }
    }

    public async Task<IEnumerable<TransactionDto>> GetAllTransactionsAsync(
        DateTime? from, DateTime? to)
    {
        var payments = await _paymentRepository.GetAllWithDetailsAsync();
        var query    = payments.AsQueryable();

        if (from.HasValue) query = query.Where(p => p.CreatedAt >= from.Value);
        if (to.HasValue)   query = query.Where(p => p.CreatedAt <= to.Value);

        return query.Select(p => new TransactionDto
        {
            Id                    = p.Id,
            OrderId               = p.OrderId,
            StripePaymentIntentId = p.StripePaymentIntentId,
            Amount                = p.Amount,
            Currency              = p.Currency,
            Status                = p.Status,
            CreatedAt             = p.CreatedAt,
        }).ToList();
    }
}
