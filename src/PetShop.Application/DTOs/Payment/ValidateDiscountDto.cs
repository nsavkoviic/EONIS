namespace PetShop.Application.DTOs.Payment;

public class ValidateDiscountDto
{
    public string Code { get; set; } = string.Empty;
}

public class DiscountResultDto
{
    public bool    IsValid         { get; set; }
    public decimal DiscountPercent { get; set; }
    public string  Message         { get; set; } = string.Empty;
    public string  Code            { get; set; } = string.Empty;
}
