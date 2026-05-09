using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetShop.Application.DTOs.Wishlist;
using PetShop.Domain.Entities;
using PetShop.Infrastructure.Persistence;

namespace PetShop.API.Controllers;

[ApiController]
[Route("api/wishlist")]
[Authorize]
public class WishlistController : ControllerBase
{
    private readonly AppDbContext _context;

    public WishlistController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<WishlistItemDto>>> GetWishlist()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var items = await _context.WishlistItems
            .Include(w => w.Product)
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.CreatedAt)
            .Select(w => new WishlistItemDto
            {
                Id                 = w.Id,
                ProductId          = w.ProductId,
                ProductName        = w.Product.Name,
                ProductImageUrl    = w.Product.ImageUrl,
                ProductPrice       = w.Product.Price,
                ProductIsAvailable = w.Product.IsAvailable,
                AddedAt            = w.CreatedAt
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost("{productId:guid}")]
    public async Task<ActionResult<WishlistItemDto>> AddToWishlist(Guid productId)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var product = await _context.Products.FindAsync(productId);
        if (product == null) return NotFound(new { detail = "Product not found." });

        var existingItem = await _context.WishlistItems
            .FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId);

        if (existingItem != null)
            return Ok(new WishlistItemDto
            {
                Id                 = existingItem.Id,
                ProductId          = product.Id,
                ProductName        = product.Name,
                ProductImageUrl    = product.ImageUrl,
                ProductPrice       = product.Price,
                ProductIsAvailable = product.IsAvailable,
                AddedAt            = existingItem.CreatedAt
            }); // Already added, return OK to be idempotent

        var newItem = new WishlistItem
        {
            UserId    = userId,
            ProductId = productId
        };

        _context.WishlistItems.Add(newItem);
        await _context.SaveChangesAsync();

        return Created($"/api/wishlist/{newItem.Id}", new WishlistItemDto
        {
            Id                 = newItem.Id,
            ProductId          = product.Id,
            ProductName        = product.Name,
            ProductImageUrl    = product.ImageUrl,
            ProductPrice       = product.Price,
            ProductIsAvailable = product.IsAvailable,
            AddedAt            = newItem.CreatedAt
        });
    }

    [HttpDelete("{productId:guid}")]
    public async Task<IActionResult> RemoveFromWishlist(Guid productId)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var item = await _context.WishlistItems
            .FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId);

        if (item == null) return NoContent(); // Idempotent

        _context.WishlistItems.Remove(item);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("check/{productId:guid}")]
    public async Task<ActionResult> CheckWishlistStatus(Guid productId)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var isInWishlist = await _context.WishlistItems
            .AnyAsync(w => w.UserId == userId && w.ProductId == productId);

        return Ok(new { isInWishlist });
    }
}
