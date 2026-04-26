namespace PetShop.Application.DTOs.Payment;

public class CreateCheckoutSessionDto
{
    public Guid OrderId { get; set; }
    public string SuccessUrl { get; set; } = string.Empty;
    public string CancelUrl { get; set; } = string.Empty;
}
