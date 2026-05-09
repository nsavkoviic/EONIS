namespace PetShop.Application.DTOs.Payment;

public class DiscountCodeDto
{
    public Guid     Id              { get; set; }
    public string   Code            { get; set; } = string.Empty;
    public decimal  DiscountPercent { get; set; }
    public bool     IsActive        { get; set; }
    public int      MaxUses         { get; set; }
    public int      UsedCount       { get; set; }
    public DateTime? ExpiresAt      { get; set; }
    public DateTime CreatedAt       { get; set; }
}

public class CreateDiscountCodeDto
{
    public string   Code            { get; set; } = string.Empty;
    public decimal  DiscountPercent { get; set; }
    public int      MaxUses         { get; set; } = 100;
    public DateTime? ExpiresAt      { get; set; }
}

public class UpdateDiscountCodeDto
{
    public bool?     IsActive  { get; set; }
    public int?      MaxUses   { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
