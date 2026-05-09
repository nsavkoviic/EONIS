namespace PetShop.Domain.Entities;

public class DiscountCode : BaseEntity
{
    public string Code            { get; set; } = string.Empty;
    public decimal DiscountPercent { get; set; }
    public bool IsActive          { get; set; } = true;
    public DateTime? ExpiresAt    { get; set; }
    public int MaxUses            { get; set; } = 100;
    public int UsedCount          { get; set; } = 0;
}
