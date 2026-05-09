using PetShop.Domain.Entities;
using PetShop.Domain.Enums;

namespace PetShop.Application.Interfaces;

public interface IProductRepository : IGenericRepository<Product>
{
    Task<IEnumerable<Product>> GetByCategoryAsync(ProductCategory category);
    Task<IEnumerable<Product>> GetAvailableProductsAsync();
    Task<IEnumerable<Product>> SearchAsync(string searchTerm);
}
