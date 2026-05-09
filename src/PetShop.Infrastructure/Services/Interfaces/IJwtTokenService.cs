using PetShop.Domain.Entities;

namespace PetShop.Infrastructure.Services.Interfaces;

/// <summary>Internal infrastructure contract for JWT token generation.</summary>
public interface IJwtTokenService
{
    (string token, DateTime expiresAt) GenerateToken(User user);
}
