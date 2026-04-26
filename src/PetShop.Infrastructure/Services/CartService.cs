using Microsoft.EntityFrameworkCore;
using PetShop.Application.DTOs.Cart;
using PetShop.Application.Interfaces;
using PetShop.Domain.Entities;
using PetShop.Domain.Exceptions;
using PetShop.Infrastructure.Persistence;

namespace PetShop.Infrastructure.Services;

public class CartService : ICartService
{
    private readonly AppDbContext _context;

    public CartService(AppDbContext context)
    {
        _context = context;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    public async Task<CartDto> GetCartAsync(Guid userId)
    {
        var cart = await GetOrCreateCartAsync(userId);
        return MapToDto(cart);
    }

    public async Task<CartDto> AddItemAsync(Guid userId, AddToCartDto dto)
    {
        // Fetch product from the SAME context instance — no cross-repository conflict
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == dto.ProductId)
            ?? throw new NotFoundException(nameof(Product), dto.ProductId);

        if (!product.IsAvailable || product.StockQuantity < dto.Quantity)
            throw new BadRequestException("Insufficient stock for the requested quantity.");

        var cart = await GetOrCreateCartAsync(userId);

        var existingItem = cart.CartItems.FirstOrDefault(ci => ci.ProductId == dto.ProductId);
        if (existingItem is not null)
        {
            var newQty = existingItem.Quantity + dto.Quantity;
            if (newQty > product.StockQuantity)
                throw new BadRequestException("Insufficient stock for the requested quantity.");

            existingItem.Quantity = newQty;     // tracked → EF issues UPDATE
        }
        else
        {
            var newItem = new CartItem
            {
                CartId    = cart.Id,
                ProductId = dto.ProductId,
                Quantity  = dto.Quantity,
            };
            // Explicitly mark Added so EF never tries UPDATE on the new Guid Id
            _context.Entry(newItem).State = EntityState.Added;
        }

        await _context.SaveChangesAsync();

        var updated = await LoadCartWithItems(cart.Id);
        return MapToDto(updated);
    }

    public async Task<CartDto> UpdateItemAsync(Guid userId, Guid productId, UpdateCartItemDto dto)
    {
        var cart = await GetOrCreateCartAsync(userId);
        var item = cart.CartItems.FirstOrDefault(ci => ci.ProductId == productId)
            ?? throw new NotFoundException(nameof(CartItem), productId);

        if (dto.Quantity <= 0)
        {
            _context.Remove(item);
        }
        else
        {
            var product = await _context.Products.FindAsync(productId);
            if (product is not null && product.StockQuantity < dto.Quantity)
                throw new BadRequestException("Insufficient stock for the requested quantity.");

            item.Quantity = dto.Quantity;
        }

        await _context.SaveChangesAsync();

        var updated = await LoadCartWithItems(cart.Id);
        return MapToDto(updated);
    }

    public async Task RemoveItemAsync(Guid userId, Guid productId)
    {
        var cart = await GetOrCreateCartAsync(userId);
        var item = cart.CartItems.FirstOrDefault(ci => ci.ProductId == productId)
            ?? throw new NotFoundException(nameof(CartItem), productId);

        _context.Remove(item);
        await _context.SaveChangesAsync();
    }

    public async Task ClearCartAsync(Guid userId)
    {
        var cart = await GetOrCreateCartAsync(userId);
        _context.RemoveRange(cart.CartItems);
        await _context.SaveChangesAsync();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<Cart> GetOrCreateCartAsync(Guid userId)
    {
        var cart = await _context.Carts
            .Include(c => c.CartItems)
                .ThenInclude(ci => ci.Product)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart is null)
        {
            cart = new Cart { UserId = userId };
            _context.Carts.Add(cart);
            await _context.SaveChangesAsync();
        }

        return cart;
    }

    private Task<Cart> LoadCartWithItems(Guid cartId) =>
        _context.Carts
            .Include(c => c.CartItems)
                .ThenInclude(ci => ci.Product)
            .FirstAsync(c => c.Id == cartId);

    // ── Mapping ───────────────────────────────────────────────────────────────

    private static CartDto MapToDto(Cart c) => new()
    {
        Id     = c.Id,
        UserId = c.UserId,
        Items  = c.CartItems.Select(ci => new CartItemDto
        {
            Id              = ci.Id,
            ProductId       = ci.ProductId,
            ProductName     = ci.Product?.Name     ?? string.Empty,
            ProductImageUrl = ci.Product?.ImageUrl,
            UnitPrice       = ci.Product?.Price    ?? 0m,
            Quantity        = ci.Quantity,
        }).ToList(),
    };
}
