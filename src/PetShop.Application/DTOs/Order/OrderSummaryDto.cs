using PetShop.Domain.Enums;

namespace PetShop.Application.DTOs.Order;

public class OrderSummaryDto
{
    public Guid Id { get; set; }
    public DateTime OrderDate { get; set; }
    public decimal TotalAmount { get; set; }
    public OrderStatus Status { get; set; }
    public int ItemCount { get; set; }
}
