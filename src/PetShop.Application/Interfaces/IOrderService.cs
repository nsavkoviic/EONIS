using PetShop.Application.DTOs.Order;
using PetShop.Application.DTOs.Product;
using PetShop.Domain.Enums;

namespace PetShop.Application.Interfaces;

public interface IOrderService
{
    Task<OrderDto> CreateOrderFromCartAsync(Guid userId, string shippingAddress);
    Task<IEnumerable<OrderSummaryDto>> GetUserOrdersAsync(Guid userId);
    Task<PagedResponseDto<OrderDto>> GetAllOrdersAsync(int page, int pageSize, OrderStatus? status);
    Task<OrderDto> GetOrderDetailsAsync(Guid orderId, Guid userId, bool isAdmin);
    Task UpdateOrderStatusAsync(Guid orderId, OrderStatus status);
}
