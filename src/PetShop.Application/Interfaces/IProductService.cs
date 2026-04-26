using PetShop.Application.DTOs.Product;

namespace PetShop.Application.Interfaces;

public interface IProductService
{
    Task<PagedResponseDto<ProductDto>> GetProductsAsync(ProductFilterDto filter);
    Task<ProductDto> GetByIdAsync(Guid id);
    Task<ProductDto> CreateAsync(CreateProductDto dto);
    Task<ProductDto> UpdateAsync(Guid id, UpdateProductDto dto);
    Task DeleteAsync(Guid id);
    Task UpdateStockAsync(Guid id, int quantity);
}
