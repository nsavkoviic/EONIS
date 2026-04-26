using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetShop.Application.DTOs.Auth;
using PetShop.Application.Interfaces;

namespace PetShop.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService          _authService;
    private readonly IValidator<RegisterDto> _registerValidator;
    private readonly IValidator<LoginDto>    _loginValidator;

    public AuthController(
        IAuthService             authService,
        IValidator<RegisterDto>  registerValidator,
        IValidator<LoginDto>     loginValidator)
    {
        _authService       = authService;
        _registerValidator = registerValidator;
        _loginValidator    = loginValidator;
    }

    /// <summary>Register a new customer account.</summary>
    [AllowAnonymous]
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var validation = await _registerValidator.ValidateAsync(dto);
        if (!validation.IsValid)
            return BadRequest(new
            {
                title  = "Validation Failed",
                status = 400,
                errors = validation.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray()),
            });

        var result = await _authService.RegisterAsync(dto);
        return CreatedAtAction(nameof(Register), result);
    }

    /// <summary>Authenticate and receive a JWT token.</summary>
    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var validation = await _loginValidator.ValidateAsync(dto);
        if (!validation.IsValid)
            return BadRequest(new
            {
                title  = "Validation Failed",
                status = 400,
                errors = validation.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray()),
            });

        var result = await _authService.LoginAsync(dto);
        return Ok(result);
    }
}
