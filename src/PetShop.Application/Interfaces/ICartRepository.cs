using PetShop.Domain.Entities;

namespace PetShop.Application.Interfaces;

public interface ICartRepository : IGenericRepository<Cart>
{
    Task<Cart?> GetByUserIdAsync(Guid userId);
    Task<Cart?> GetWithItemsAsync(Guid cartId);
}
