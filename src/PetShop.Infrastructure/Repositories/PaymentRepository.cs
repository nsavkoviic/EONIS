using Microsoft.EntityFrameworkCore;
using PetShop.Application.Interfaces;
using PetShop.Domain.Entities;
using PetShop.Infrastructure.Persistence;

namespace PetShop.Infrastructure.Repositories;

public class PaymentRepository : GenericRepository<Payment>, IPaymentRepository
{
    public PaymentRepository(AppDbContext context) : base(context) { }

    public async Task<Payment?> GetByStripeSessionIdAsync(string sessionId) =>
        await _dbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.StripeSessionId == sessionId);

    public async Task<Payment?> GetByOrderIdAsync(Guid orderId) =>
        await _dbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.OrderId == orderId);

    public async Task<IEnumerable<Payment>> GetAllWithDetailsAsync() =>
        await _dbSet
            .AsNoTracking()
            .Include(p => p.Order)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
}
