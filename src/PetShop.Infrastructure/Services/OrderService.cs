using PetShop.Application.DTOs.Order;
using PetShop.Application.DTOs.Product;
using PetShop.Application.Interfaces;
using PetShop.Domain.Entities;
using PetShop.Domain.Enums;
using PetShop.Domain.Exceptions;

namespace PetShop.Infrastructure.Services;

public class OrderService : IOrderService
{
    private readonly IOrderRepository   _orderRepository;
    private readonly ICartRepository    _cartRepository;
    private readonly IProductRepository _productRepository;

    public OrderService(
        IOrderRepository   orderRepository,
        ICartRepository    cartRepository,
        IProductRepository productRepository)
    {
        _orderRepository   = orderRepository;
        _cartRepository    = cartRepository;
        _productRepository = productRepository;
    }

    public async Task<OrderDto> CreateOrderFromCartAsync(Guid userId, string shippingAddress)
    {
        var cart = await _cartRepository.GetByUserIdAsync(userId);

        if (cart is null || !cart.CartItems.Any())
            throw new BadRequestException("Cannot create an order from an empty cart.");

        // Validate stock and calculate total
        var orderItems = new List<OrderItem>();
        decimal total  = 0;

        foreach (var cartItem in cart.CartItems)
        {
            var product = await _productRepository.GetByIdAsync(cartItem.ProductId)
                ?? throw new NotFoundException(nameof(Product), cartItem.ProductId);

            if (product.StockQuantity < cartItem.Quantity)
                throw new BadRequestException(
                    $"Insufficient stock for '{product.Name}'. Available: {product.StockQuantity}.");

            var lineTotal = product.Price * cartItem.Quantity;
            total += lineTotal;

            orderItems.Add(new OrderItem
            {
                ProductId = product.Id,
                Quantity  = cartItem.Quantity,
                UnitPrice = product.Price,
            });

            // Deduct stock
            product.StockQuantity -= cartItem.Quantity;
            if (product.StockQuantity == 0) product.IsAvailable = false;
            await _productRepository.UpdateAsync(product);
        }

        var order = new Order
        {
            UserId          = userId,
            TotalAmount     = total,
            ShippingAddress = shippingAddress,
            OrderItems      = orderItems,
        };

        await _orderRepository.AddAsync(order);

        // Clear cart
        cart.CartItems.Clear();
        await _cartRepository.UpdateAsync(cart);

        // Reload with full navigation for mapping
        var created = await _orderRepository.GetWithItemsAsync(order.Id);
        return MapToOrderDto(created!);
    }

    public async Task<IEnumerable<OrderSummaryDto>> GetUserOrdersAsync(Guid userId)
    {
        var orders = await _orderRepository.GetByUserIdAsync(userId);
        return orders.Select(MapToSummaryDto);
    }

    public async Task<PagedResponseDto<OrderDto>> GetAllOrdersAsync(
        int page, int pageSize, OrderStatus? status)
    {
        var all = await _orderRepository.GetAllWithDetailsAsync();
        var query = all.AsQueryable();

        if (status.HasValue)
            query = query.Where(o => o.Status == status.Value);

        var totalCount = query.Count();
        var items = query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(MapToOrderDto)
            .ToList();

        return new PagedResponseDto<OrderDto>
        {
            Items      = items,
            TotalCount = totalCount,
            Page       = page,
            PageSize   = pageSize,
        };
    }

    public async Task<OrderDto> GetOrderDetailsAsync(Guid orderId, Guid userId, bool isAdmin)
    {
        var order = await _orderRepository.GetWithItemsAsync(orderId)
            ?? throw new NotFoundException(nameof(Order), orderId);

        if (!isAdmin && order.UserId != userId)
            throw new UnauthorizedException("You are not authorized to view this order.");

        return MapToOrderDto(order);
    }

    public async Task UpdateOrderStatusAsync(Guid orderId, OrderStatus status)
    {
        var order = await _orderRepository.GetByIdAsync(orderId)
            ?? throw new NotFoundException(nameof(Order), orderId);

        order.Status = status;
        await _orderRepository.UpdateAsync(order);
    }

    // ── Mapping ───────────────────────────────────────────────────────────────
    private static OrderDto MapToOrderDto(Order o) => new()
    {
        Id                   = o.Id,
        UserId               = o.UserId,
        UserEmail            = o.User?.Email ?? string.Empty,
        OrderDate            = o.OrderDate,
        TotalAmount          = o.TotalAmount,
        Status               = o.Status,
        ShippingAddress      = o.ShippingAddress,
        StripePaymentIntentId = o.StripePaymentIntentId,
        Items = o.OrderItems.Select(oi => new OrderItemDto
        {
            Id              = oi.Id,
            ProductId       = oi.ProductId,
            ProductName     = oi.Product?.Name     ?? string.Empty,
            ProductImageUrl = oi.Product?.ImageUrl,
            Quantity        = oi.Quantity,
            UnitPrice       = oi.UnitPrice,
            TotalPrice      = oi.UnitPrice * oi.Quantity,
        }).ToList(),
    };

    private static OrderSummaryDto MapToSummaryDto(Order o) => new()
    {
        Id          = o.Id,
        OrderDate   = o.OrderDate,
        TotalAmount = o.TotalAmount,
        Status      = o.Status,
        ItemCount   = o.OrderItems.Count,
    };
}
