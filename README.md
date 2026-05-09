# PetShop — Online Pet Store

A full-stack e-commerce application for pet supplies built with Clean Architecture (.NET 8) and Angular 17.

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | ASP.NET Core Web API (.NET 8), Entity Framework Core 8, SQL Server LocalDB |
| **Frontend** | Angular 17, Angular Material 17 (indigo-pink theme) |
| **Auth** | JWT Bearer tokens — roles: `Admin` / `Customer` |
| **Payments** | Stripe Checkout (test mode) with webhook handler |
| **Validation** | FluentValidation (.NET) · Reactive Forms (Angular) |

## Getting Started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)
- SQL Server LocalDB *(included with Visual Studio)*
- Angular CLI 17: `npm install -g @angular/cli@17`

### Quick start

```powershell
.\start-dev.ps1
```

Opens two terminal windows — API on **http://localhost:5118**, Angular on **http://localhost:4200**.

### Manual start

```powershell
# Terminal 1 — Backend API
dotnet run --project src/PetShop.API/PetShop.API.csproj

# Terminal 2 — Angular frontend
cd petshop-frontend
ng serve
```

### Default credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@petshop.com | Admin123! |
| **Customer** | register a new account via /auth/register | — |

### API Documentation

Swagger UI: **http://localhost:5118** (auto-opens on backend start)

---

## Project Structure

```
EONIS/
├── src/
│   ├── PetShop.API/                  # Controllers, middleware, Program.cs
│   │   ├── Controllers/              # Auth, Products, Cart, Orders, Payments
│   │   └── Middleware/               # GlobalExceptionHandlerMiddleware
│   ├── PetShop.Application/          # Business logic contracts
│   │   ├── DTOs/                     # Auth, Product, Cart, Order, Payment DTOs
│   │   ├── Interfaces/               # IGenericRepository<T>, IXxxService
│   │   └── Validators/               # FluentValidation rules
│   ├── PetShop.Domain/               # Core domain
│   │   ├── Entities/                 # User, Product, Order, Cart, Payment...
│   │   ├── Enums/                    # UserRole, OrderStatus, ProductCategory...
│   │   └── Exceptions/               # NotFoundException, BadRequestException...
│   └── PetShop.Infrastructure/       # Data and external services
│       ├── Persistence/              # AppDbContext, DataSeeder, Migrations
│       ├── Repositories/             # EF Core generic + specific repositories
│       ├── Services/                 # Auth, Product, Cart, Order, Payment services
│       └── Settings/                 # JwtSettings, StripeSettings
└── petshop-frontend/                 # Angular 17 SPA
    └── src/app/
        ├── core/
        │   ├── guards/               # authGuard, adminGuard
        │   ├── interceptors/         # jwtInterceptor
        │   ├── models/               # TypeScript interfaces and enums
        │   └── services/             # Auth, Product, Cart, Order, Payment
        ├── features/
        │   ├── auth/                 # Login, Register
        │   ├── home/                 # Landing page
        │   ├── products/             # Product list, Product detail
        │   ├── cart/                 # Shopping cart
        │   ├── checkout/             # 2-step checkout + Stripe redirect
        │   ├── orders/               # My orders
        │   └── admin/                # Product mgmt, Order mgmt, Transactions
        └── shared/
            └── navbar/               # Responsive navbar with auth state
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new customer |
| POST | `/api/auth/login` | Public | Login, receive JWT |
| GET | `/api/products` | Public | Paginated + filtered list |
| GET | `/api/products/{id}` | Public | Single product |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/{id}` | Admin | Update product |
| DELETE | `/api/products/{id}` | Admin | Delete product |
| PATCH | `/api/products/{id}/stock` | Admin | Update stock |
| GET | `/api/cart` | Auth | Get cart |
| POST | `/api/cart/items` | Auth | Add to cart |
| PUT | `/api/cart/items/{productId}` | Auth | Update quantity |
| DELETE | `/api/cart/items/{productId}` | Auth | Remove item |
| DELETE | `/api/cart` | Auth | Clear cart |
| POST | `/api/orders` | Customer | Create order from cart |
| GET | `/api/orders/my` | Auth | My orders |
| GET | `/api/orders/{id}` | Auth | Order details |
| GET | `/api/orders` | Admin | All orders (paginated) |
| PATCH | `/api/orders/{id}/status` | Admin | Update order status |
| POST | `/api/payments/checkout-session` | Customer | Create Stripe session |
| POST | `/api/payments/webhook` | Public | Stripe webhook receiver |
| GET | `/api/payments/transactions` | Admin | All transactions |

---

## Stripe Test Mode

| Field | Value |
|---|---|
| Card Number | `4242 4242 4242 4242` |
| Expiry | Any future date |
| CVC | Any 3 digits |

---

## Database

Auto-created and seeded on first startup:
- Runs `MigrateAsync()` at startup
- Seeds 1 admin user + 10 products (Dogs, Cats, Birds categories) if DB is empty

**Reset the database:**
```powershell
dotnet ef database drop --project src/PetShop.Infrastructure/PetShop.Infrastructure.csproj --startup-project src/PetShop.API/PetShop.API.csproj
dotnet ef database update --project src/PetShop.Infrastructure/PetShop.Infrastructure.csproj --startup-project src/PetShop.API/PetShop.API.csproj
```

---

## Configuration (`src/PetShop.API/appsettings.json`)

```json
{
  "ConnectionStrings": { "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=PetShopDb;Trusted_Connection=True;" },
  "JwtSettings": { "Secret": "YourSuperSecretKey...", "Issuer": "PetShopAPI", "Audience": "PetShopClient", "ExpiryMinutes": 60 },
  "StripeSettings": { "SecretKey": "sk_test_...", "WebhookSecret": "whsec_..." }
}
```