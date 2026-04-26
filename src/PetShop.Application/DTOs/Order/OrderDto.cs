using PetShop.Domain.Enums;

namespace PetShop.Application.DTOs.Order;

public class OrderDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public decimal TotalAmount { get; set; }
    public OrderStatus Status { get; set; }
    public string? ShippingAddress { get; set; }
    public string? StripePaymentIntentId { get; set; }
    public ICollection<OrderItemDto> Items { get; set; } = new List<OrderItemDto>();
}
