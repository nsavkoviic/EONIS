using System;
using System.Collections.Generic;

namespace PetShop.Application.DTOs.Review;

public class ReviewDto
{
    public Guid     Id        { get; set; }
    public Guid     ProductId { get; set; }
    public Guid     UserId    { get; set; }
    public string   UserName  { get; set; } = string.Empty;
    public int      Rating    { get; set; }
    public string   Comment   { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool     IsApproved { get; set; }
    public string   ProductName { get; set; } = string.Empty;
}

public class CreateReviewDto
{
    public int    Rating  { get; set; }  // 1-5
    public string Comment { get; set; } = string.Empty;
}

public class ProductReviewSummaryDto
{
    public double         AverageRating { get; set; }
    public int            TotalReviews  { get; set; }
    public List<ReviewDto> Reviews      { get; set; } = new();
    public bool           UserHasReviewed { get; set; }
    public bool           UserCanReview { get; set; }
}
