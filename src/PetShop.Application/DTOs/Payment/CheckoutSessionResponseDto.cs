namespace PetShop.Application.DTOs.Payment;

public class CheckoutSessionResponseDto
{
    public string SessionId { get; set; } = string.Empty;
    public string CheckoutUrl { get; set; } = string.Empty;
}
