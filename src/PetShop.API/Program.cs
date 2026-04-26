using System.Text;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PetShop.API.Middleware;
using PetShop.Application.Validators;
using PetShop.Infrastructure;
using PetShop.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// ── Infrastructure (EF, repositories, services, settings) ────────────────────
builder.Services.AddInfrastructure(builder.Configuration);

// ── FluentValidation ─────────────────────────────────────────────────────────
builder.Services.AddValidatorsFromAssemblyContaining<RegisterDtoValidator>();

// ── Controllers ───────────────────────────────────────────────────────────────
builder.Services.AddControllers();

// ── JWT Authentication ────────────────────────────────────────────────────────
var jwtSection  = builder.Configuration.GetSection("JwtSettings");
var jwtSecret   = jwtSection["Secret"]   ?? throw new InvalidOperationException("JwtSettings:Secret is not configured.");
var jwtIssuer   = jwtSection["Issuer"]   ?? throw new InvalidOperationException("JwtSettings:Issuer is not configured.");
var jwtAudience = jwtSection["Audience"] ?? throw new InvalidOperationException("JwtSettings:Audience is not configured.");

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = jwtIssuer,
            ValidAudience            = jwtAudience,
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew                = TimeSpan.Zero,   // no tolerance on expiry
        };
    });

// ── Authorization Policies ────────────────────────────────────────────────────
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly",    policy => policy.RequireRole("Admin"));
    options.AddPolicy("CustomerOnly", policy => policy.RequireRole("Customer"));
});

// ── CORS ──────────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ── Swagger / OpenAPI ─────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title       = "PetShop API",
        Version     = "v1",
        Description = "REST API for the PetShop online pet store.",
    });

    // JWT security definition
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = SecuritySchemeType.Http,
        Scheme       = "bearer",
        BearerFormat = "JWT",
        In           = ParameterLocation.Header,
        Description  = "Enter your JWT token (without the 'Bearer ' prefix).",
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id   = "Bearer",
                },
            },
            Array.Empty<string>()
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────
var app = builder.Build();
// ─────────────────────────────────────────────────────────────────────────────

// ── Apply migrations and seed data on startup ─────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await DataSeeder.SeedAsync(db);
}

// 1. CORS — must be before auth & routing
app.UseCors("AllowAngular");

// 2. Global exception handling
app.UseGlobalExceptionHandler();

// 3. Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// 4. Swagger (available in all environments for this project)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "PetShop API v1");
    c.RoutePrefix = string.Empty;   // Swagger at root "/"
});

// 5. Map controllers
app.MapControllers();

app.Run();
