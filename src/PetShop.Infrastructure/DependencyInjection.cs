using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PetShop.Application.Interfaces;
using PetShop.Infrastructure.Persistence;
using PetShop.Infrastructure.Repositories;
using PetShop.Infrastructure.Services;
using PetShop.Infrastructure.Services.Interfaces;
using PetShop.Infrastructure.Settings;

namespace PetShop.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ── EF Core ───────────────────────────────────────────────────────────
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                sql => sql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));

        // ── Settings ─────────────────────────────────────────────────────────
        services.Configure<JwtSettings>(configuration.GetSection("JwtSettings"));
        services.Configure<StripeSettings>(configuration.GetSection("StripeSettings"));

        // ── Repositories ─────────────────────────────────────────────────────
        services.AddScoped<IUserRepository,    UserRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IOrderRepository,   OrderRepository>();
        services.AddScoped<ICartRepository,    CartRepository>();
        services.AddScoped<IPaymentRepository, PaymentRepository>();

        // ── Internal services ─────────────────────────────────────────────────
        services.AddScoped<IJwtTokenService, JwtTokenService>();

        // ── Application services ──────────────────────────────────────────────
        services.AddScoped<IAuthService,    AuthService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<ICartService,    CartService>();
        services.AddScoped<IOrderService,   OrderService>();
        services.AddScoped<IPaymentService, PaymentService>();

        return services;
    }
}
