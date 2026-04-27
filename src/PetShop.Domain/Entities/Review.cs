using System;

namespace PetShop.Domain.Entities;

public class Review : BaseEntity
{
    public Guid   ProductId { get; set; }
    public Guid   UserId    { get; set; }
    public int    Rating    { get; set; }  // 1-5
    public string Comment   { get; set; } = string.Empty;
    public string UserName  { get; set; } = string.Empty; // denormalized for display
    public bool   IsApproved { get; set; } = false;

    public Product Product { get; set; } = null!;
    public User    User    { get; set; } = null!;
}
