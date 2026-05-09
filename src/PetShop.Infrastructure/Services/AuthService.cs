using PetShop.Application.DTOs.Auth;
using PetShop.Application.Interfaces;
using PetShop.Domain.Entities;
using PetShop.Domain.Exceptions;
using PetShop.Infrastructure.Helpers;
using PetShop.Infrastructure.Services.Interfaces;

namespace PetShop.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtTokenService _jwtTokenService;

    public AuthService(IUserRepository userRepository, IJwtTokenService jwtTokenService)
    {
        _userRepository = userRepository;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        if (await _userRepository.EmailExistsAsync(dto.Email))
            throw new BadRequestException($"Email '{dto.Email}' is already in use.");

        var user = new User
        {
            FirstName = dto.FirstName,
            LastName  = dto.LastName,
            Email     = dto.Email.ToLowerInvariant(),
            PasswordHash = PasswordHelper.HashPassword(dto.Password),
            PhoneNumber  = dto.PhoneNumber,
            Address      = dto.Address,
        };

        await _userRepository.AddAsync(user);

        var (token, expiresAt) = _jwtTokenService.GenerateToken(user);

        return new AuthResponseDto
        {
            Token     = token,
            ExpiresAt = expiresAt,
            User      = MapToUserDto(user),
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await _userRepository.GetByEmailAsync(dto.Email)
            ?? throw new UnauthorizedException("Invalid email or password.");

        if (!user.IsActive)
            throw new UnauthorizedException("Your account has been deactivated.");

        if (!PasswordHelper.VerifyPassword(dto.Password, user.PasswordHash))
            throw new UnauthorizedException("Invalid email or password.");

        var (token, expiresAt) = _jwtTokenService.GenerateToken(user);

        return new AuthResponseDto
        {
            Token     = token,
            ExpiresAt = expiresAt,
            User      = MapToUserDto(user),
        };
    }

    // ── Mapping ───────────────────────────────────────────────────────────────
    private static UserDto MapToUserDto(User u) => new()
    {
        Id          = u.Id,
        FirstName   = u.FirstName,
        LastName    = u.LastName,
        Email       = u.Email,
        PhoneNumber = u.PhoneNumber,
        Address     = u.Address,
        Role        = u.Role,
        IsActive    = u.IsActive,
        CreatedAt   = u.CreatedAt,
    };
}
