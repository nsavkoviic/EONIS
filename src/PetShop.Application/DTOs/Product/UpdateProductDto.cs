using PetShop.Domain.Enums;

namespace PetShop.Application.DTOs.Product;

public class UpdateProductDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public decimal? Price { get; set; }
    public int? StockQuantity { get; set; }
    public string? ImageUrl { get; set; }
    public ProductCategory? Category { get; set; }
    public bool? IsAvailable { get; set; }
}
