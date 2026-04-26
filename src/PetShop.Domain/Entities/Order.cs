using PetShop.Domain.Enums;

namespace PetShop.Domain.Entities;

public class Order : BaseEntity
{
    public Guid UserId { get; set; }
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public decimal TotalAmount { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public string? ShippingAddress { get; set; }
    public string? StripePaymentIntentId { get; set; }
    public string? StripeSessionId { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
