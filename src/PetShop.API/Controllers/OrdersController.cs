using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetShop.Application.DTOs.Order;
using PetShop.Application.DTOs.Product;
using PetShop.Application.Interfaces;
using PetShop.Domain.Enums;

namespace PetShop.API.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("User ID claim is missing."));

    /// <summary>Create an order from the current user's cart (Customer only).</summary>
    [Authorize(Roles = "Customer")]
    [HttpPost]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto dto)
    {
        var order = await _orderService.CreateOrderFromCartAsync(CurrentUserId, dto.ShippingAddress);
        return CreatedAtAction(nameof(GetOrderById), new { id = order.Id }, order);
    }

    /// <summary>Get all orders with optional status filter (Admin only).</summary>
    [Authorize(Roles = "Admin")]
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponseDto<OrderDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllOrders(
        [FromQuery] int          page     = 1,
        [FromQuery] int          pageSize = 10,
        [FromQuery] OrderStatus? status   = null)
    {
        var orders = await _orderService.GetAllOrdersAsync(page, pageSize, status);
        return Ok(orders);
    }

    /// <summary>Get the authenticated user's own orders.</summary>
    [Authorize]
    [HttpGet("my")]
    [ProducesResponseType(typeof(IEnumerable<OrderSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyOrders()
    {
        var orders = await _orderService.GetUserOrdersAsync(CurrentUserId);
        return Ok(orders);
    }

    /// <summary>Get order details — Admin sees all, Customer sees only their own.</summary>
    [Authorize]
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetOrderById([FromRoute] Guid id)
    {
        var isAdmin = User.IsInRole("Admin");
        var order   = await _orderService.GetOrderDetailsAsync(id, CurrentUserId, isAdmin);
        return Ok(order);
    }

    /// <summary>Update an order's status (Admin only).</summary>
    [Authorize(Roles = "Admin")]
    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateOrderStatus(
        [FromRoute] Guid               id,
        [FromBody]  UpdateStatusRequest request)
    {
        await _orderService.UpdateOrderStatusAsync(id, request.Status);
        return Ok(new { message = "Order status updated.", orderId = id, status = request.Status.ToString() });
    }
}

/// <summary>Request body for order status update.</summary>
public sealed record UpdateStatusRequest(OrderStatus Status);
