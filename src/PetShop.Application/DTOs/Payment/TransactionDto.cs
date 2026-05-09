using PetShop.Domain.Enums;

namespace PetShop.Application.DTOs.Payment;

public class TransactionDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string? StripePaymentIntentId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "usd";
    public PaymentStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}
