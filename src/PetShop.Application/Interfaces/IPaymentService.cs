using PetShop.Application.DTOs.Payment;

namespace PetShop.Application.Interfaces;

public interface IPaymentService
{
    Task<CheckoutSessionResponseDto> CreateCheckoutSessionAsync(
        Guid orderId,
        Guid userId,
        string successUrl,
        string cancelUrl);

    Task HandleWebhookAsync(string payload, string stripeSignature);

    Task<IEnumerable<TransactionDto>> GetAllTransactionsAsync(DateTime? from, DateTime? to);
}
