# Test WhatsApp Notifications for Real Phone Numbers
# This script tests sending notifications to 2 real parent phone numbers

Write-Host "=== WhatsApp Notification Test for Real Numbers ===" -ForegroundColor Cyan

Write-Host ""
Write-Host "Target Phone Numbers:" -ForegroundColor Yellow
Write-Host "  1. +918850623515 (Ananya Gupta - Parent of Aditya Kumar, 1A01)" -ForegroundColor White
Write-Host "  2. +919867805724 (Rahul Nair - Parent of Nisha Naik, 1A02)" -ForegroundColor White

Write-Host ""
Write-Host "IMPORTANT NOTES:" -ForegroundColor Red
Write-Host "  - These are REAL phone numbers" -ForegroundColor Yellow
Write-Host "  - WhatsApp messages will be sent to actual people" -ForegroundColor Yellow
Write-Host "  - Make sure WhatsApp plugin is running on port 4100" -ForegroundColor Yellow
Write-Host "  - Template 'assignment_update' must be approved in Meta" -ForegroundColor Yellow

Write-Host ""
$confirm = Read-Host "Do you want to proceed with sending real WhatsApp messages? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host ""
    Write-Host "Test cancelled." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "=== Test Configuration ===" -ForegroundColor Cyan
Write-Host "Class: CLASS 1" -ForegroundColor White
Write-Host "Section: A" -ForegroundColor White
Write-Host "Subject: Physics" -ForegroundColor White
Write-Host "Date: $(Get-Date -Format 'dd-MM-yyyy')" -ForegroundColor White

# Test 1: Check WhatsApp Plugin Health
Write-Host ""
Write-Host "=== Step 1: Checking WhatsApp Plugin ===" -ForegroundColor Yellow

try {
    $health = Invoke-RestMethod -Uri "http://localhost:4100/health" -Method GET -ErrorAction Stop
    Write-Host "[OK] WhatsApp plugin is running on port 4100" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] WhatsApp plugin is not running!" -ForegroundColor Red
    Write-Host "  Please start it with: npm run dev:stack" -ForegroundColor Yellow
    Write-Host "  Or: npm run dev -w whatsapp_plugin" -ForegroundColor Yellow
    exit 1
}

# Test 2: Check Database Connection
Write-Host ""
Write-Host "=== Step 2: Checking Database ===" -ForegroundColor Yellow

try {
    $dbCheck = Invoke-RestMethod -Uri "http://localhost:3000/api/mysql/profiles/students" -Method GET -ErrorAction Stop
    Write-Host "[OK] Database connection working" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Database connection failed!" -ForegroundColor Red
    Write-Host "  Please start the Next.js app: npm run dev" -ForegroundColor Yellow
    exit 1
}

# Test 3: Send Test Notification
Write-Host ""
Write-Host "=== Step 3: Sending WhatsApp Notifications ===" -ForegroundColor Yellow

$today = Get-Date -Format "yyyy-MM-dd"

$requestBody = @{
    klass = "CLASS 1"
    section = "A"
    subject = "Physics"
    date = $today
} | ConvertTo-Json

Write-Host "Sending request to TEST notification API (only 2 numbers)..." -ForegroundColor White

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/diary/notify-test" `
        -Method POST `
        -ContentType "application/json" `
        -Body $requestBody `
        -ErrorAction Stop
    
    Write-Host ""
    Write-Host "[OK] Notification API Response:" -ForegroundColor Green
    Write-Host "  Success: $($response.success)" -ForegroundColor White
    Write-Host "  Sent: $($response.sent)" -ForegroundColor Green
    Write-Host "  Skipped: $($response.skipped)" -ForegroundColor Yellow
    Write-Host "  Failed: $($response.failed)" -ForegroundColor $(if ($response.failed -gt 0) { "Red" } else { "White" })
    Write-Host "  Total Students: $($response.total)" -ForegroundColor White
    Write-Host "  Message: $($response.message)" -ForegroundColor Cyan
    
    if ($response.sent -eq 2) {
        Write-Host ""
        Write-Host "[SUCCESS] Both messages sent!" -ForegroundColor Green
    } elseif ($response.sent -gt 0) {
        Write-Host ""
        Write-Host "[WARNING] Partial success. Some messages sent." -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "[ERROR] No messages sent!" -ForegroundColor Red
    }
    
} catch {
    Write-Host ""
    Write-Host "[ERROR] Failed to send notifications!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
    exit 1
}

# Test 4: Verify in WhatsApp Plugin Logs
Write-Host ""
Write-Host "=== Step 4: Check WhatsApp Plugin Logs ===" -ForegroundColor Yellow
Write-Host "Check the WhatsApp plugin terminal for:" -ForegroundColor White
Write-Host "  - Message sent to +918850623515" -ForegroundColor Cyan
Write-Host "  - Message sent to +919867805724" -ForegroundColor Cyan

# Expected Message
Write-Host ""
Write-Host "=== Expected WhatsApp Message ===" -ForegroundColor Yellow
Write-Host "New assignment has been published." -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Subject: Physics" -ForegroundColor White
Write-Host "Class: CLASS 1 - A" -ForegroundColor White
Write-Host "Date: $(Get-Date -Format 'dd-MM-yyyy')" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Please check the assignment details in the ERP." -ForegroundColor White

# Manual Verification Steps
Write-Host ""
Write-Host "=== Manual Verification ===" -ForegroundColor Cyan
Write-Host "1. Check WhatsApp on these phones:" -ForegroundColor White
Write-Host "   - +918850623515 (Ananya Gupta)" -ForegroundColor White
Write-Host "   - +919867805724 (Rahul Nair)" -ForegroundColor White
Write-Host ""
Write-Host "2. Verify message content matches above" -ForegroundColor White
Write-Host ""
Write-Host "3. Check WhatsApp plugin logs for delivery status" -ForegroundColor White

# Summary
Write-Host ""
Write-Host "=== Test Summary ===" -ForegroundColor Green
Write-Host "[OK] WhatsApp plugin: Running" -ForegroundColor White
Write-Host "[OK] Database: Connected" -ForegroundColor White
Write-Host "[OK] API: Called successfully" -ForegroundColor White
Write-Host "[OK] Messages: Sent to $($response.sent) parent(s)" -ForegroundColor White

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Verify messages received on actual phones" -ForegroundColor White
Write-Host "2. Check message formatting and content" -ForegroundColor White
Write-Host "3. Test the full flow from teacher UI" -ForegroundColor White

Write-Host ""
Write-Host "[DONE] Test completed!" -ForegroundColor Green
