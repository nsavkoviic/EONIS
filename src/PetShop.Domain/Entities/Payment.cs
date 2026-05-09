using PetShop.Domain.Enums;

namespace PetShop.Domain.Entities;

public class Payment : BaseEntity
{
    public Guid OrderId { get; set; }
    public string? StripeSessionId { get; set; }
    public string? StripePaymentIntentId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "usd";
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    // Navigation properties
    public Order Order { get; set; } = null!;
}
