using PetShop.Domain.Entities;
using PetShop.Domain.Enums;

namespace PetShop.Application.Interfaces;

public interface IOrderRepository : IGenericRepository<Order>
{
    Task<IEnumerable<Order>> GetByUserIdAsync(Guid userId);
    Task<Order?> GetWithItemsAsync(Guid orderId);
    Task<IEnumerable<Order>> GetAllWithDetailsAsync();
}
