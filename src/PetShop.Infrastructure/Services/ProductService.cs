using PetShop.Application.DTOs.Product;
using PetShop.Application.Interfaces;
using PetShop.Domain.Entities;
using PetShop.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;
using PetShop.Infrastructure.Persistence;

namespace PetShop.Infrastructure.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _productRepository;
    private readonly AppDbContext _context;

    public ProductService(IProductRepository productRepository, AppDbContext context)
    {
        _productRepository = productRepository;
        _context = context;
    }

    public async Task<PagedResponseDto<ProductDto>> GetProductsAsync(ProductFilterDto filter)
    {
        // Build base query with filters
        var query = _context.Products.AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(term)
                                  || p.Description.ToLower().Contains(term));
        }
        if (filter.Category.HasValue)
            query = query.Where(p => p.Category == filter.Category.Value);
        if (filter.MinPrice.HasValue)
            query = query.Where(p => p.Price >= filter.MinPrice.Value);
        if (filter.MaxPrice.HasValue)
            query = query.Where(p => p.Price <= filter.MaxPrice.Value);
        if (filter.IsAvailable.HasValue)
            query = query.Where(p => p.IsAvailable == filter.IsAvailable.Value);

        // Sorting
        query = filter.SortBy?.ToLower() switch
        {
            "price" => filter.SortDescending
                ? query.OrderByDescending(p => p.Price)
                : query.OrderBy(p => p.Price),
            "name" => filter.SortDescending
                ? query.OrderByDescending(p => p.Name)
                : query.OrderBy(p => p.Name),
            _ => query.OrderByDescending(p => p.CreatedAt),
        };

        var totalCount = await query.CountAsync();

        // Single query: join with reviews for aggregated rating
        var items = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(p => new ProductDto
            {
                Id            = p.Id,
                Name          = p.Name,
                Description   = p.Description,
                Price         = p.Price,
                StockQuantity = p.StockQuantity,
                ImageUrl      = p.ImageUrl,
                Category      = p.Category,
                IsAvailable   = p.IsAvailable,
                CreatedAt     = p.CreatedAt,
                ReviewCount   = _context.Reviews.Count(r => r.ProductId == p.Id),
                AverageRating = _context.Reviews.Where(r => r.ProductId == p.Id).Any()
                    ? _context.Reviews.Where(r => r.ProductId == p.Id).Average(r => r.Rating)
                    : 0,
            })
            .ToListAsync();

        return new PagedResponseDto<ProductDto>
        {
            Items      = items,
            TotalCount = totalCount,
            Page       = filter.Page,
            PageSize   = filter.PageSize,
        };
    }

    public async Task<ProductDto> GetByIdAsync(Guid id)
    {
        var dto = await _context.Products
            .Where(p => p.Id == id)
            .Select(p => new ProductDto
            {
                Id            = p.Id,
                Name          = p.Name,
                Description   = p.Description,
                Price         = p.Price,
                StockQuantity = p.StockQuantity,
                ImageUrl      = p.ImageUrl,
                Category      = p.Category,
                IsAvailable   = p.IsAvailable,
                CreatedAt     = p.CreatedAt,
                ReviewCount   = _context.Reviews.Count(r => r.ProductId == p.Id),
                AverageRating = _context.Reviews.Where(r => r.ProductId == p.Id).Any()
                    ? _context.Reviews.Where(r => r.ProductId == p.Id).Average(r => r.Rating)
                    : 0,
            })
            .FirstOrDefaultAsync()
            ?? throw new NotFoundException(nameof(Product), id);

        return dto;
    }

    public async Task<ProductDto> CreateAsync(CreateProductDto dto)
    {
        var product = new Product
        {
            Name          = dto.Name,
            Description   = dto.Description,
            Price         = dto.Price,
            StockQuantity = dto.StockQuantity,
            ImageUrl      = dto.ImageUrl,
            Category      = dto.Category,
            IsAvailable   = dto.StockQuantity > 0,
        };

        await _productRepository.AddAsync(product);
        return MapToDto(product);
    }

    public async Task<ProductDto> UpdateAsync(Guid id, UpdateProductDto dto)
    {
        var product = await _productRepository.GetByIdAsync(id)
            ?? throw new NotFoundException(nameof(Product), id);

        if (dto.Name        is not null) product.Name          = dto.Name;
        if (dto.Description is not null) product.Description   = dto.Description;
        if (dto.Price       is not null) product.Price         = dto.Price.Value;
        if (dto.StockQuantity is not null) product.StockQuantity = dto.StockQuantity.Value;
        if (dto.ImageUrl    is not null) product.ImageUrl      = dto.ImageUrl;
        if (dto.Category    is not null) product.Category      = dto.Category.Value;
        if (dto.IsAvailable is not null) product.IsAvailable   = dto.IsAvailable.Value;

        await _productRepository.UpdateAsync(product);
        return MapToDto(product);
    }

    public async Task DeleteAsync(Guid id)
    {
        var product = await _productRepository.GetByIdAsync(id)
            ?? throw new NotFoundException(nameof(Product), id);

        await _productRepository.DeleteAsync(product);
    }

    public async Task UpdateStockAsync(Guid id, int quantity)
    {
        var product = await _productRepository.GetByIdAsync(id)
            ?? throw new NotFoundException(nameof(Product), id);

        if (quantity < 0)
            throw new BadRequestException("Stock quantity cannot be negative.");

        product.StockQuantity = quantity;
        product.IsAvailable   = quantity > 0;

        await _productRepository.UpdateAsync(product);
    }

    // ── Mapping ───────────────────────────────────────────────────────────────
    private static ProductDto MapToDto(Product p) => new()
    {
        Id            = p.Id,
        Name          = p.Name,
        Description   = p.Description,
        Price         = p.Price,
        StockQuantity = p.StockQuantity,
        ImageUrl      = p.ImageUrl,
        Category      = p.Category,
        IsAvailable   = p.IsAvailable,
        CreatedAt     = p.CreatedAt,
    };
}
