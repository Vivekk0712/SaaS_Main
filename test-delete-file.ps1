# Test script for file deletion from B2 and MySQL
# This tests the complete delete flow

Write-Host "Testing File Deletion from B2 and MySQL..." -ForegroundColor Cyan

# Test data - replace with actual B2 key from your database
$testB2Key = "school-erp/10/A/Mathematics/materials/1234567890_test.pdf"

# Test delete API
Write-Host "`nTesting DELETE API..." -ForegroundColor Yellow
$deleteResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/storage/delete" `
    -Method POST `
    -ContentType "application/json" `
    -Body (@{
        b2Key = $testB2Key
    } | ConvertTo-Json)

Write-Host "Delete Response:" -ForegroundColor Green
$deleteResponse | ConvertTo-Json -Depth 3

Write-Host "`nTest completed!" -ForegroundColor Cyan
Write-Host "Expected behavior:" -ForegroundColor Yellow
Write-Host "1. File deleted from Backblaze B2 storage" -ForegroundColor White
Write-Host "2. Record deleted from MySQL materials table" -ForegroundColor White
Write-Host "3. Record deleted from MySQL textbooks table (if exists)" -ForegroundColor White
