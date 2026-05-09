using PetShop.Domain.Entities;

namespace PetShop.Application.Interfaces;

public interface IPaymentRepository : IGenericRepository<Payment>
{
    Task<Payment?> GetByStripeSessionIdAsync(string sessionId);
    Task<Payment?> GetByOrderIdAsync(Guid orderId);
    Task<IEnumerable<Payment>> GetAllWithDetailsAsync();
}
