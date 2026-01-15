# Setup Gallery Feature
# Run this after pulling the gallery changes

Write-Host "=== Setting up Gallery Feature ===" -ForegroundColor Cyan

# Step 1: Apply database changes
Write-Host "`nStep 1: Creating gallery tables..." -ForegroundColor Yellow

try {
    mysql -u sas_app -p"9482824040" sas < sql/gallery-tables.sql
    Write-Host "[OK] Gallery tables created!" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to create tables" -ForegroundColor Red
    Write-Host "Try manually: mysql -u sas_app -p sas < sql/gallery-tables.sql" -ForegroundColor Yellow
    exit 1
}

# Step 2: Verify tables exist
Write-Host "`nStep 2: Verifying tables..." -ForegroundColor Yellow

$tables = mysql -u sas_app -p"9482824040" sas -e "SHOW TABLES LIKE 'gallery%';" 2>$null

if ($tables -match "gallery_images" -and $tables -match "gallery_albums") {
    Write-Host "[OK] All gallery tables exist!" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Some tables might be missing" -ForegroundColor Yellow
}

# Step 3: Check upload directory
Write-Host "`nStep 3: Checking upload directory..." -ForegroundColor Yellow

$uploadDir = "apps/frontend-next/public/uploads/gallery"
if (Test-Path $uploadDir) {
    Write-Host "[OK] Upload directory exists" -ForegroundColor Green
    $fileCount = (Get-ChildItem $uploadDir -File).Count
    Write-Host "  Found $fileCount sample images" -ForegroundColor Cyan
} else {
    Write-Host "[INFO] Creating upload directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $uploadDir -Force | Out-Null
    Write-Host "[OK] Upload directory created" -ForegroundColor Green
}

# Summary
Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green

Write-Host "`nGallery Feature URLs:" -ForegroundColor Cyan
Write-Host "  Admin Gallery:  http://localhost:3000/admin/gallery" -ForegroundColor White
Write-Host "  Parent Gallery: http://localhost:3000/parent/gallery" -ForegroundColor White

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "1. Restart your dev server: npm run dev:stack" -ForegroundColor White
Write-Host "2. Login as admin and go to /admin/gallery" -ForegroundColor White
Write-Host "3. Create albums and upload photos" -ForegroundColor White
Write-Host "4. Parents can view galleries at /parent/gallery" -ForegroundColor White

Write-Host "`n[DONE] Gallery feature is ready!" -ForegroundColor Green
