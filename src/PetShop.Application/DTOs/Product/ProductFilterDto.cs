using PetShop.Domain.Enums;

namespace PetShop.Application.DTOs.Product;

public class ProductFilterDto
{
    public string? SearchTerm { get; set; }
    public ProductCategory? Category { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public bool? IsAvailable { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SortBy { get; set; }       // e.g. "price", "name"
    public bool SortDescending { get; set; } = false;
}
