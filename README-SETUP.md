# Setup Instructions

## 1 — Backend Configuration

Copy the example config and fill in your actual secrets:

```powershell
Copy-Item src/PetShop.API/appsettings.example.json src/PetShop.API/appsettings.json
```

Then edit `src/PetShop.API/appsettings.json`:

| Setting | How to get it |
|---|---|
| `JwtSettings.Secret` | Any random 32+ character string (e.g. `openssl rand -base64 32`) |
| `StripeSettings.SecretKey` | [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys) |
| `StripeSettings.WebhookSecret` | Run `stripe listen` locally — copy the `whsec_...` printed on startup |
| `ConnectionStrings.DefaultConnection` | Default LocalDB value works out of the box with Visual Studio |

> ⚠️ **Never commit `appsettings.json`** — it is in `.gitignore`. Only `appsettings.example.json` is committed.

---

## 2 — Frontend

No secrets needed. The API URL is configured in:

```
petshop-frontend/src/environments/environment.ts
```

Default value points to `http://localhost:5118/api` — change if your backend runs on a different port.

---

## 3 — Database

The database is **created and migrated automatically** on first backend startup.
Seed data (admin user + 10 products) is inserted if the database is empty.

To run migrations manually:

```powershell
dotnet ef database update `
  --project src/PetShop.Infrastructure/PetShop.Infrastructure.csproj `
  --startup-project src/PetShop.API/PetShop.API.csproj
```

To reset the database:

```powershell
dotnet ef database drop `
  --project src/PetShop.Infrastructure/PetShop.Infrastructure.csproj `
  --startup-project src/PetShop.API/PetShop.API.csproj
```

---

## 4 — Stripe Webhook (local development)

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:

```bash
stripe listen --forward-to http://localhost:5118/api/payments/webhook
```

Copy the `whsec_...` secret printed and paste it into `appsettings.json`.

---

## 5 — Start the application

```powershell
.\start-dev.ps1
```

| URL | Service |
|---|---|
| http://localhost:5118 | Backend API + Swagger UI |
| http://localhost:4200 | Angular frontend |

### Default admin credentials

| Field | Value |
|---|---|
| Email | admin@petshop.com |
| Password | Admin123! |
