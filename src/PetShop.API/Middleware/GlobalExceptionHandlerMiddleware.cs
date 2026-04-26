using System.Net;
using System.Text.Json;
using FluentValidation;
using PetShop.Domain.Exceptions;

namespace PetShop.API.Middleware;

public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;

    public GlobalExceptionHandlerMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionHandlerMiddleware> logger)
    {
        _next   = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception for {Method} {Path}",
                context.Request.Method, context.Request.Path);

            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, title, detail, errors) = exception switch
        {
            NotFoundException nfe =>
                (HttpStatusCode.NotFound,      "Not Found",            nfe.Message, (Dictionary<string, string[]>?)null),

            BadRequestException bre =>
                (HttpStatusCode.BadRequest,    "Bad Request",          bre.Message, null),

            UnauthorizedException ue =>
                (HttpStatusCode.Unauthorized,  "Unauthorized",         ue.Message,  null),

            ValidationException ve =>
                (HttpStatusCode.BadRequest,    "Validation Failed",    "One or more validation errors occurred.",
                 ve.Errors
                   .GroupBy(e => e.PropertyName)
                   .ToDictionary(
                       g => g.Key,
                       g => g.Select(e => e.ErrorMessage).ToArray())),

            _ =>
                (HttpStatusCode.InternalServerError, "Internal Server Error",
                 "An unexpected error occurred.", null),
        };

        context.Response.StatusCode = (int)statusCode;

        object body = errors is not null
            ? new { title, status = (int)statusCode, detail, errors }
            : new { title, status = (int)statusCode, detail };

        var json = JsonSerializer.Serialize(body, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        });

        await context.Response.WriteAsync(json);
    }
}

// Extension method for clean registration in Program.cs
public static class GlobalExceptionHandlerMiddlewareExtensions
{
    public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app)
        => app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
}
