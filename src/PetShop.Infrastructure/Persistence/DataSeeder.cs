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

        // ── Discount Codes ───────────────────────────────────────────────
        if (!context.DiscountCodes.Any())
        {
            context.DiscountCodes.AddRange(
                new Domain.Entities.DiscountCode
                {
                    Code            = "WELCOME10",
                    DiscountPercent = 10m,
                    MaxUses         = 1000,
                    IsActive        = true,
                },
                new Domain.Entities.DiscountCode
                {
                    Code            = "PETLOVER20",
                    DiscountPercent = 20m,
                    MaxUses         = 500,
                    IsActive        = true,
                    ExpiresAt       = DateTime.UtcNow.AddMonths(6),
                }
            );
        }

        await context.SaveChangesAsync();
    }

    public static async Task UpdateProductImagesAsync(AppDbContext context)
    {
        var products = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(context.Products);
        if (!products.Any()) return;

        // Map product names to Unsplash image URLs (direct image URLs)
        var imageMap = new Dictionary<string, string>
        {
            ["Royal Canin Adult Dog Food 15kg"] = 
                "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&h=400&fit=crop",
            ["KONG Classic Dog Toy"] = 
                "https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=400&h=400&fit=crop",
            ["Flexi Retractable Dog Leash 5m"] = 
                "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop",
            ["Ruffwear Front Range Dog Harness"] = 
                "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=400&fit=crop",
            ["Pedigree Dentastix Daily Dental Treats"] = 
                "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=400&fit=crop",
            ["Whiskas Adult Cat Food 10kg"] = 
                "https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=400&h=400&fit=crop",
            ["Catit Design Scratcher with Catnip"] = 
                "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=400&fit=crop",
            ["Feliway Classic Diffuser Starter Kit"] = 
                "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400&h=400&fit=crop",
            ["Vitapol Economic Bird Food 500g"] = 
                "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400&h=400&fit=crop",
            ["Prevue Pet Products Wrought-Iron Bird Cage"] = 
                "https://images.unsplash.com/photo-1522858547137-f1dcec554f55?w=400&h=400&fit=crop",
        };

        bool changed = false;
        foreach (var product in products)
        {
            if (imageMap.TryGetValue(product.Name, out var url))
            {
                product.ImageUrl = url;
                changed = true;
            }
        }

        if (changed) await context.SaveChangesAsync();
    }
}
