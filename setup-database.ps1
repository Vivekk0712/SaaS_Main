# Database Setup Script for Windows
# This script sets up the MySQL database and user for the SAS project

Write-Host "=== SAS Database Setup ===" -ForegroundColor Cyan

# Check if MySQL is installed
Write-Host "`nChecking MySQL installation..." -ForegroundColor Yellow
$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

if (-not (Test-Path $mysqlPath)) {
    Write-Host "MySQL not found at default location." -ForegroundColor Red
    Write-Host "Please enter the full path to mysql.exe:" -ForegroundColor Yellow
    $mysqlPath = Read-Host
    
    if (-not (Test-Path $mysqlPath)) {
        Write-Host "MySQL not found. Please install MySQL first." -ForegroundColor Red
        exit 1
    }
}

Write-Host "✓ MySQL found at: $mysqlPath" -ForegroundColor Green

# Get root password
Write-Host "`nEnter MySQL root password:" -ForegroundColor Yellow
$rootPassword = Read-Host -AsSecureString
$rootPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($rootPassword)
)

# Step 1: Create database and user
Write-Host "`nStep 1: Creating database and user..." -ForegroundColor Yellow

$setupScript = @"
CREATE DATABASE IF NOT EXISTS sas;
CREATE USER IF NOT EXISTS 'sas_app'@'localhost' IDENTIFIED BY 'sas_strong_password_123';
GRANT ALL PRIVILEGES ON sas.* TO 'sas_app'@'localhost';
FLUSH PRIVILEGES;
SELECT 'Database and user created successfully!' AS Status;
"@

$setupScript | & $mysqlPath -u root -p"$rootPasswordPlain" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database and user created successfully!" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to create database and user" -ForegroundColor Red
    Write-Host "Please check your root password and try again." -ForegroundColor Yellow
    exit 1
}

# Step 2: Apply schema
Write-Host "`nStep 2: Applying database schema..." -ForegroundColor Yellow

if (Test-Path "sql/schema.sql") {
    & $mysqlPath -u sas_app -p"sas_strong_password_123" sas < sql/schema.sql 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Schema applied successfully!" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to apply schema" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✗ Schema file not found: sql/schema.sql" -ForegroundColor Red
    exit 1
}

# Step 3: Create .env file
Write-Host "`nStep 3: Creating .env file..." -ForegroundColor Yellow

$envContent = @"
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=sas_app
DB_PASSWORD=sas_strong_password_123
DB_NAME=sas

# WhatsApp Plugin
WHATSAPP_PLUGIN_URL=http://localhost:3002

# RAG Chatbot Plugin
RAG_PLUGIN_URL=http://localhost:4000

# Backblaze B2 (Optional - add your credentials)
# B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
# B2_REGION=us-west-004
# B2_BUCKET_NAME=
# B2_KEY_ID=
# B2_APPLICATION_KEY=
"@

if (-not (Test-Path ".env")) {
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✓ .env file created" -ForegroundColor Green
} else {
    Write-Host "! .env file already exists, skipping..." -ForegroundColor Yellow
}

# Step 4: Seed data
Write-Host "`nStep 4: Seeding demo data..." -ForegroundColor Yellow
Write-Host "This will create demo students, teachers, and classes." -ForegroundColor White

$seedChoice = Read-Host "Do you want to seed demo data? (Y/N)"

if ($seedChoice -eq "Y" -or $seedChoice -eq "y") {
    npm run db:seed
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Demo data seeded successfully!" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to seed data" -ForegroundColor Red
        Write-Host "You can run 'npm run db:seed' manually later." -ForegroundColor Yellow
    }
} else {
    Write-Host "Skipping data seeding. You can run 'npm run db:seed' later." -ForegroundColor Yellow
}

# Summary
Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green
Write-Host "`nDatabase Details:" -ForegroundColor Cyan
Write-Host "  Host: localhost" -ForegroundColor White
Write-Host "  Port: 3306" -ForegroundColor White
Write-Host "  Database: sas" -ForegroundColor White
Write-Host "  User: sas_app" -ForegroundColor White
Write-Host "  Password: sas_strong_password_123" -ForegroundColor White

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "  1. Install dependencies: npm install" -ForegroundColor White
Write-Host "  2. Start development server: npm run dev" -ForegroundColor White
Write-Host "  3. Access the app: http://localhost:3000" -ForegroundColor White

Write-Host "`nTest Database Connection:" -ForegroundColor Cyan
Write-Host "  mysql -u sas_app -p sas" -ForegroundColor White
Write-Host "  Password: sas_strong_password_123" -ForegroundColor White

Write-Host "`n✓ All done! Happy coding! 🎉" -ForegroundColor Green
