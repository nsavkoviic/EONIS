using PetShop.Application.DTOs.Product;
using PetShop.Application.Interfaces;
using PetShop.Domain.Entities;
using PetShop.Domain.Exceptions;

namespace PetShop.Infrastructure.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _productRepository;

    public ProductService(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<PagedResponseDto<ProductDto>> GetProductsAsync(ProductFilterDto filter)
    {
        var query = (await _productRepository.GetAllAsync()).AsQueryable();

        // ── Filtering ─────────────────────────────────────────────────────────
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

        // ── Sorting ───────────────────────────────────────────────────────────
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

        var totalCount = query.Count();

        // ── Pagination ────────────────────────────────────────────────────────
        var items = query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(MapToDto)
            .ToList();

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
        var product = await _productRepository.GetByIdAsync(id)
            ?? throw new NotFoundException(nameof(Product), id);

        return MapToDto(product);
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
