using Microsoft.EntityFrameworkCore;
using PetShop.Application.Interfaces;
using PetShop.Domain.Entities;
using PetShop.Domain.Enums;
using PetShop.Infrastructure.Persistence;

namespace PetShop.Infrastructure.Repositories;

public class ProductRepository : GenericRepository<Product>, IProductRepository
{
    public ProductRepository(AppDbContext context) : base(context) { }

    public async Task<IEnumerable<Product>> GetByCategoryAsync(ProductCategory category) =>
        await _dbSet
            .AsNoTracking()
            .Where(p => p.Category == category)
            .ToListAsync();

    public async Task<IEnumerable<Product>> GetAvailableProductsAsync() =>
        await _dbSet
            .AsNoTracking()
            .Where(p => p.IsAvailable && p.StockQuantity > 0)
            .ToListAsync();

    public async Task<IEnumerable<Product>> SearchAsync(string searchTerm)
    {
        var term = searchTerm.ToLower();
        return await _dbSet
            .AsNoTracking()
            .Where(p => p.Name.ToLower().Contains(term)
                     || p.Description.ToLower().Contains(term))
            .ToListAsync();
    }
}
