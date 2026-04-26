using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetShop.Application.DTOs.Product;
using PetShop.Application.Interfaces;
using PetShop.Domain.Enums;

namespace PetShop.API.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    /// <summary>Get a paginated, filtered product list.</summary>
    [AllowAnonymous]
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponseDto<ProductDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProducts(
        [FromQuery] string?          searchTerm,
        [FromQuery] ProductCategory? category,
        [FromQuery] decimal?         minPrice,
        [FromQuery] decimal?         maxPrice,
        [FromQuery] bool?            isAvailable,
        [FromQuery] int              page           = 1,
        [FromQuery] int              pageSize       = 10,
        [FromQuery] string?          sortBy         = null,
        [FromQuery] bool             sortDescending = false)
    {
        var filter = new ProductFilterDto
        {
            SearchTerm     = searchTerm,
            Category       = category,
            MinPrice       = minPrice,
            MaxPrice       = maxPrice,
            IsAvailable    = isAvailable,
            Page           = page,
            PageSize       = pageSize,
            SortBy         = sortBy,
            SortDescending = sortDescending,
        };

        var result = await _productService.GetProductsAsync(filter);
        return Ok(result);
    }

    /// <summary>Get a single product by ID.</summary>
    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById([FromRoute] Guid id)
    {
        var product = await _productService.GetByIdAsync(id);
        return Ok(product);
    }

    /// <summary>Create a new product (Admin only).</summary>
    [Authorize(Roles = "Admin")]
    [HttpPost]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
    {
        var created = await _productService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>Update an existing product (Admin only).</summary>
    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update([FromRoute] Guid id, [FromBody] UpdateProductDto dto)
    {
        var updated = await _productService.UpdateAsync(id, dto);
        return Ok(updated);
    }

    /// <summary>Delete a product (Admin only).</summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromRoute] Guid id)
    {
        await _productService.DeleteAsync(id);
        return NoContent();
    }

    /// <summary>Update product stock quantity (Admin only).</summary>
    [Authorize(Roles = "Admin")]
    [HttpPatch("{id:guid}/stock")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStock(
        [FromRoute] Guid id,
        [FromBody]  UpdateStockRequest request)
    {
        await _productService.UpdateStockAsync(id, request.Quantity);
        return Ok(new { message = "Stock updated successfully.", productId = id, quantity = request.Quantity });
    }
}

/// <summary>Request body for stock update.</summary>
public sealed record UpdateStockRequest(int Quantity);
