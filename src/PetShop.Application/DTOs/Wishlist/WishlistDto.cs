using System;

namespace PetShop.Application.DTOs.Wishlist;

public class WishlistItemDto
{
    public Guid    Id        { get; set; }
    public Guid    ProductId { get; set; }
    public string  ProductName     { get; set; } = string.Empty;
    public string? ProductImageUrl { get; set; }
    public decimal ProductPrice    { get; set; }
    public bool    ProductIsAvailable { get; set; }
    public DateTime AddedAt        { get; set; }
}
