using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetShop.Application.DTOs.Review;
using PetShop.Domain.Entities;
using PetShop.Domain.Enums;
using PetShop.Infrastructure.Persistence;

namespace PetShop.API.Controllers;

[ApiController]
[Route("api/products/{productId:guid}/reviews")]
public class ReviewsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReviewsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ProductReviewSummaryDto>> GetProductReviews(Guid productId)
    {
        var reviews = await _context.Reviews
            .Where(r => r.ProductId == productId && r.IsApproved)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewDto
            {
                Id        = r.Id,
                ProductId = r.ProductId,
                UserId    = r.UserId,
                UserName  = r.UserName,
                Rating    = r.Rating,
                Comment   = r.Comment,
                CreatedAt = r.CreatedAt,
                IsApproved = r.IsApproved
            })
            .ToListAsync();

        var summary = new ProductReviewSummaryDto
        {
            TotalReviews = reviews.Count,
            AverageRating = reviews.Any() ? reviews.Average(r => r.Rating) : 0,
            Reviews = reviews
        };

        var userHasReviewed = false;
        var userCanReview = false;
        if (User.Identity?.IsAuthenticated == true)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(userIdStr, out var userId))
            {
                // Check ALL reviews (including pending) for this user
                userHasReviewed = await _context.Reviews
                    .AnyAsync(r => r.ProductId == productId && r.UserId == userId);
                
                userCanReview = !userHasReviewed && 
                    await _context.OrderItems
                        .AnyAsync(oi => oi.ProductId == productId &&
                                        oi.Order.UserId == userId &&
                                        (oi.Order.Status == OrderStatus.Processing ||
                                         oi.Order.Status == OrderStatus.Shipped ||
                                         oi.Order.Status == OrderStatus.Delivered));
            }
        }
        
        summary.UserHasReviewed = userHasReviewed;
        summary.UserCanReview   = userCanReview;

        return Ok(summary);
    }

    [HttpPost]
    [Authorize(Roles = "Customer")]
    public async Task<ActionResult<ReviewDto>> AddReview(Guid productId, [FromBody] CreateReviewDto dto)
    {
        if (dto.Rating < 1 || dto.Rating > 5)
            return BadRequest(new { detail = "Rating must be between 1 and 5." });

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var existingReview = await _context.Reviews
            .FirstOrDefaultAsync(r => r.ProductId == productId && r.UserId == userId);
        
        if (existingReview != null)
            return BadRequest(new { detail = "You have already reviewed this product." });

        // Check if user purchased the product
        var hasPurchased = await _context.OrderItems
            .AnyAsync(oi => oi.ProductId == productId && 
                            oi.Order.UserId == userId &&
                            (oi.Order.Status == OrderStatus.Processing || 
                             oi.Order.Status == OrderStatus.Shipped || 
                             oi.Order.Status == OrderStatus.Delivered));

        if (!hasPurchased)
            return BadRequest(new { detail = "You can only review products you have purchased." });

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        var review = new Review
        {
            ProductId = productId,
            UserId    = userId,
            Rating    = dto.Rating,
            Comment   = dto.Comment,
            UserName  = $"{user.FirstName} {user.LastName}".Trim(),
            IsApproved = false
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();

        var reviewDto = new ReviewDto
        {
            Id        = review.Id,
            ProductId = review.ProductId,
            UserId    = review.UserId,
            UserName  = review.UserName,
            Rating    = review.Rating,
            Comment   = review.Comment,
            CreatedAt = review.CreatedAt,
            IsApproved = review.IsApproved
        };

        return StatusCode(201, new { message = "Review submitted and is pending approval", review = reviewDto });
    }

    [HttpDelete("{reviewId:guid}")]
    [Authorize]
    public async Task<IActionResult> DeleteReview(Guid productId, Guid reviewId)
    {
        var review = await _context.Reviews.FirstOrDefaultAsync(r => r.Id == reviewId && r.ProductId == productId);
        if (review == null) return NotFound();

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin   = User.IsInRole("Admin");

        if (!Guid.TryParse(userIdStr, out var userId) || (!isAdmin && review.UserId != userId))
            return Forbid();

        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("pending")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> GetPendingReviewsForProduct(Guid productId)
    {
        var pending = await _context.Reviews
            .Where(r => r.ProductId == productId && !r.IsApproved)
            .Select(r => new ReviewDto
            {
                Id        = r.Id,
                ProductId = r.ProductId,
                UserId    = r.UserId,
                UserName  = r.UserName,
                Rating    = r.Rating,
                Comment   = r.Comment,
                CreatedAt = r.CreatedAt,
                IsApproved = r.IsApproved
            })
            .ToListAsync();
        return Ok(pending);
    }

    [HttpGet("/api/reviews/pending")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> GetAllPendingReviews()
    {
        var pending = await _context.Reviews
            .Include(r => r.Product)
            .Where(r => !r.IsApproved)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewDto
            {
                Id          = r.Id,
                ProductId   = r.ProductId,
                UserId      = r.UserId,
                UserName    = r.UserName,
                Rating      = r.Rating,
                Comment     = r.Comment,
                CreatedAt   = r.CreatedAt,
                IsApproved  = r.IsApproved,
                ProductName = r.Product.Name
            })
            .ToListAsync();
        return Ok(pending);
    }

    [HttpPatch("{reviewId:guid}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> ApproveReview(Guid productId, Guid reviewId)
    {
        var review = await _context.Reviews
            .FirstOrDefaultAsync(r => r.Id == reviewId && r.ProductId == productId);
        if (review is null) return NotFound();
        
        review.IsApproved = true;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Review approved" });
    }
}
