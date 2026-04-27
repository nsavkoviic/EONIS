using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetShop.Application.DTOs.Auth;
using PetShop.Infrastructure.Persistence;

namespace PetShop.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly AppDbContext _context;

    public UserController(AppDbContext context)
    {
        _context = context;
    }

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("User ID claim is missing."));

    /// <summary>Get current user profile.</summary>
    [HttpGet("profile")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProfile()
    {
        var user = await _context.Users.FindAsync(CurrentUserId);
        if (user is null) return NotFound();

        return Ok(new UserProfileDto
        {
            Id          = user.Id,
            FirstName   = user.FirstName,
            LastName    = user.LastName,
            Email       = user.Email,
            PhoneNumber = user.PhoneNumber,
            Address     = user.Address,
            FavoriteAnimalTypes = ParseJson<List<int>>(user.FavoriteAnimalTypes) ?? new(),
            CurrentPets         = ParseJson<List<PetDto>>(user.CurrentPets) ?? new(),
        });
    }

    /// <summary>Update current user profile.</summary>
    [HttpPut("profile")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var user = await _context.Users.FindAsync(CurrentUserId);
        if (user is null) return NotFound();

        if (dto.FirstName   is not null) user.FirstName   = dto.FirstName;
        if (dto.LastName    is not null) user.LastName    = dto.LastName;
        if (dto.PhoneNumber is not null) user.PhoneNumber = dto.PhoneNumber;
        if (dto.Address     is not null) user.Address     = dto.Address;

        if (dto.FavoriteAnimalTypes is not null)
            user.FavoriteAnimalTypes = JsonSerializer.Serialize(dto.FavoriteAnimalTypes);
        if (dto.CurrentPets is not null)
            user.CurrentPets = JsonSerializer.Serialize(dto.CurrentPets);

        await _context.SaveChangesAsync();

        return Ok(new UserProfileDto
        {
            Id          = user.Id,
            FirstName   = user.FirstName,
            LastName    = user.LastName,
            Email       = user.Email,
            PhoneNumber = user.PhoneNumber,
            Address     = user.Address,
            FavoriteAnimalTypes = ParseJson<List<int>>(user.FavoriteAnimalTypes) ?? new(),
            CurrentPets         = ParseJson<List<PetDto>>(user.CurrentPets) ?? new(),
        });
    }

    private static T? ParseJson<T>(string? json) where T : class
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try { return JsonSerializer.Deserialize<T>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }); }
        catch { return null; }
    }
}
