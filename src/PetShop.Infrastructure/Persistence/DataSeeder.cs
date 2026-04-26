using PetShop.Domain.Entities;
using PetShop.Domain.Enums;
using PetShop.Infrastructure.Helpers;

namespace PetShop.Infrastructure.Persistence;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        // Only seed if database is empty
        if (context.Users.Any()) return;

        // ── Admin user ────────────────────────────────────────────────────────
        var admin = new User
        {
            FirstName    = "Admin",
            LastName     = "PetShop",
            Email        = "admin@petshop.com",
            PasswordHash = PasswordHelper.HashPassword("Admin123!"),
            Role         = UserRole.Admin,
            IsActive     = true,
        };
        context.Users.Add(admin);

        // ── Products ──────────────────────────────────────────────────────────

        // Dogs
        context.Products.AddRange(
            new Product
            {
                Name          = "Royal Canin Adult Dog Food 15kg",
                Description   = "Scientifically formulated dry food for adult dogs, supporting optimal digestion and a healthy coat. Suitable for medium-breed dogs aged 1–7 years.",
                Price         = 54.99m,
                StockQuantity = 60,
                Category      = ProductCategory.Dogs,
                IsAvailable   = true,
                ImageUrl      = "https://placehold.co/400x400?text=Royal+Canin",
            },
            new Product
            {
                Name          = "KONG Classic Dog Toy",
                Description   = "Durable natural rubber toy designed to satisfy dogs' instinctual needs and keep them mentally stimulated. Fill with treats or peanut butter for extra enrichment.",
                Price         = 12.99m,
                StockQuantity = 85,
                Category      = ProductCategory.Dogs,
                IsAvailable   = true,
                ImageUrl      = "https://placehold.co/400x400?text=KONG+Classic",
            },
            new Product
            {
                Name          = "Flexi Retractable Dog Leash 5m",
                Description   = "Lightweight retractable leash with a 5-metre cord, ergonomic brake button, and reflective strip for safe evening walks. Suitable for dogs up to 25 kg.",
                Price         = 19.49m,
                StockQuantity = 45,
                Category      = ProductCategory.Dogs,
                IsAvailable   = true,
                ImageUrl      = "https://placehold.co/400x400?text=Flexi+Leash",
            },
            new Product
            {
                Name          = "Ruffwear Front Range Dog Harness",
                Description   = "Padded, everyday dog harness with two leash attachment points for versatile control on the trail or around town. Reflective trim enhances low-light visibility.",
                Price         = 49.95m,
                StockQuantity = 30,
                Category      = ProductCategory.Dogs,
                IsAvailable   = true,
                ImageUrl      = "https://placehold.co/400x400?text=Ruffwear+Harness",
            },
            new Product
            {
                Name          = "Pedigree Dentastix Daily Dental Treats",
                Description   = "X-shaped daily dental chews that reduce tartar build-up by up to 80% and freshen breath. Pack of 28 sticks, suitable for medium dogs.",
                Price         = 8.29m,
                StockQuantity = 100,
                Category      = ProductCategory.Dogs,
                IsAvailable   = true,
                ImageUrl      = "https://placehold.co/400x400?text=Dentastix",
            }
        );

        // Cats
        context.Products.AddRange(
            new Product
            {
                Name          = "Whiskas Adult Cat Food 10kg",
                Description   = "Complete dry food for adult cats made with real chicken, providing balanced nutrition for a healthy immune system and shiny coat.",
                Price         = 29.99m,
                StockQuantity = 70,
                Category      = ProductCategory.Cats,
                IsAvailable   = true,
                ImageUrl      = "https://placehold.co/400x400?text=Whiskas",
            },
            new Product
            {
                Name          = "Catit Design Scratcher with Catnip",
                Description   = "Corrugated cardboard scratcher in a sleek wave design that satisfies natural scratching instincts. Includes a bag of premium catnip to attract and stimulate your cat.",
                Price         = 14.49m,
                StockQuantity = 55,
                Category      = ProductCategory.Cats,
                IsAvailable   = true,
                ImageUrl      = "https://placehold.co/400x400?text=Catit+Scratcher",
            },
            new Product
            {
                Name          = "Feliway Classic Diffuser Starter Kit",
                Description   = "Plug-in diffuser that releases a synthetic copy of the feline facial pheromone, helping cats feel calm and reducing stress-related behaviours such as scratching or hiding.",
                Price         = 34.95m,
                StockQuantity = 40,
                Category      = ProductCategory.Cats,
                IsAvailable   = true,
                ImageUrl      = "https://placehold.co/400x400?text=Feliway",
            }
        );

        // Birds
        context.Products.AddRange(
            new Product
            {
                Name          = "Vitapol Economic Bird Food 500g",
                Description   = "Nutritionally balanced seed mix for small parrots and budgerigars, enriched with vitamins and minerals for vibrant plumage and energy.",
                Price         = 4.99m,
                StockQuantity = 90,
                Category      = ProductCategory.Birds,
                IsAvailable   = true,
                ImageUrl      = "https://placehold.co/400x400?text=Vitapol+Seeds",
            },
            new Product
            {
                Name          = "Prevue Pet Products Wrought-Iron Bird Cage",
                Description   = "Spacious wrought-iron cage with multiple perches, two feeder cups, and a pull-out waste tray for easy cleaning. Ideal for cockatiels and small parrots.",
                Price         = 89.99m,
                StockQuantity = 15,
                Category      = ProductCategory.Birds,
                IsAvailable   = true,
                ImageUrl      = "https://placehold.co/400x400?text=Bird+Cage",
            }
        );

        await context.SaveChangesAsync();
    }
}
