# PetShop Dev Launcher
# Starts backend API and Angular frontend in separate PowerShell windows

$root = $PSScriptRoot

# Start backend
Start-Process powershell -ArgumentList `
  "-NoExit", "-Command", `
  "cd '$root'; dotnet run --project src/PetShop.API/PetShop.API.csproj"

Start-Sleep -Seconds 3

# Start frontend
Start-Process powershell -ArgumentList `
  "-NoExit", "-Command", `
  "cd '$root\petshop-frontend'; ng serve --open"

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  PetShop is starting..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  Backend:  http://localhost:5118/swagger" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:4200" -ForegroundColor Cyan
Write-Host "  Admin:    admin@petshop.com / Admin123!" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""
