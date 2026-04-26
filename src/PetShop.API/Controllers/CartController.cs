using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetShop.Application.DTOs.Cart;
using PetShop.Application.Interfaces;

namespace PetShop.API.Controllers;

[ApiController]
[Route("api/cart")]
[Authorize]
public class CartController : ControllerBase
{
    private readonly ICartService _cartService;

    public CartController(ICartService cartService)
    {
        _cartService = cartService;
    }

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("User ID claim is missing."));

    /// <summary>Get the current user's cart.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCart()
    {
        var cart = await _cartService.GetCartAsync(CurrentUserId);
        return Ok(cart);
    }

    /// <summary>Add a product to the cart.</summary>
    [HttpPost("items")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddItem([FromBody] AddToCartDto dto)
    {
        var cart = await _cartService.AddItemAsync(CurrentUserId, dto);
        return Ok(cart);
    }

    /// <summary>Update quantity of a cart item (set to 0 to remove it).</summary>
    [HttpPut("items/{productId:guid}")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateItem(
        [FromRoute] Guid productId,
        [FromBody]  UpdateCartItemDto dto)
    {
        var cart = await _cartService.UpdateItemAsync(CurrentUserId, productId, dto);
        return Ok(cart);
    }

    /// <summary>Remove a single product from the cart.</summary>
    [HttpDelete("items/{productId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveItem([FromRoute] Guid productId)
    {
        await _cartService.RemoveItemAsync(CurrentUserId, productId);
        return NoContent();
    }

    /// <summary>Clear all items from the cart.</summary>
    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ClearCart()
    {
        await _cartService.ClearCartAsync(CurrentUserId);
        return NoContent();
    }
}
