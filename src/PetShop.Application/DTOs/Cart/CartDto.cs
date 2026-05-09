namespace PetShop.Application.DTOs.Cart;

public class CartDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public ICollection<CartItemDto> Items { get; set; } = new List<CartItemDto>();
    public decimal TotalPrice => Items.Sum(i => i.TotalPrice);
    public int TotalItems => Items.Sum(i => i.Quantity);
}
