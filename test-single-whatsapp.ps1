# Test Single WhatsApp Message
# Send a test message to one phone number to verify template

Write-Host "=== Single WhatsApp Message Test ===" -ForegroundColor Cyan

Write-Host "`nAvailable test numbers:" -ForegroundColor Yellow
Write-Host "1. +918850623515 (Ananya Gupta)" -ForegroundColor White
Write-Host "2. +919867805724 (Rahul Nair)" -ForegroundColor White

$choice = Read-Host "`nSelect number to test (1 or 2)"

$phoneNumber = if ($choice -eq "1") { "+918850623515" } else { "+919867805724" }
$parentName = if ($choice -eq "1") { "Ananya Gupta" } else { "Rahul Nair" }

Write-Host "`n📱 Sending test message to: $phoneNumber ($parentName)" -ForegroundColor Cyan

# Check WhatsApp plugin
Write-Host "`nChecking WhatsApp plugin..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3002/health" -Method GET -ErrorAction Stop
    Write-Host "[OK] WhatsApp plugin is running" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] WhatsApp plugin not running!" -ForegroundColor Red
    Write-Host "Start it with: npm run dev -w whatsapp_plugin" -ForegroundColor Yellow
    exit 1
}

# Send message
Write-Host "`nSending WhatsApp message..." -ForegroundColor Yellow

$requestBody = @{
    to = $phoneNumber
    template = "assignment_update"
    language = "en"
    parameters = @(
        "Physics",
        "CLASS 1 - A",
        (Get-Date -Format "dd-MM-yyyy")
    )
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3002/api/whatsapp/send-template" `
        -Method POST `
        -ContentType "application/json" `
        -Body $requestBody `
        -ErrorAction Stop
    
    Write-Host "`n[OK] Message sent successfully!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 3 | Write-Host
    
    Write-Host "`nCheck WhatsApp on $phoneNumber" -ForegroundColor Yellow
    Write-Host "Expected message:" -ForegroundColor White
    Write-Host @"

New assignment has been published.

Subject: Physics
Class: CLASS 1 - A
Date: $(Get-Date -Format 'dd-MM-yyyy')

Please check the assignment details in the ERP.
"@ -ForegroundColor Cyan

} catch {
    Write-Host "`n[ERROR] Failed to send message!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
}

Write-Host "`n[DONE] Test completed!" -ForegroundColor Green
