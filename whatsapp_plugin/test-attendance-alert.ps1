# PowerShell test script for attendance_alert template
# Make sure the WhatsApp plugin is running on port 4100

# ⚠️ IMPORTANT: Change this to a phone number registered in your WhatsApp Business Account
# The number must be added as a test recipient in Meta Business Manager
# See FIX_ACCOUNT_NOT_REGISTERED.md for instructions
$TEST_PHONE_NUMBER = "+918850623515"  # ← CHANGE THIS TO YOUR REGISTERED NUMBER

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "WhatsApp Attendance Alert Test" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Testing with phone number: $TEST_PHONE_NUMBER" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  Make sure this number is registered in Meta Business Manager!" -ForegroundColor Yellow
Write-Host "   See: FIX_ACCOUNT_NOT_REGISTERED.md" -ForegroundColor Gray
Write-Host ""

$body = @{
    tenantId = "demo-school"
    type = "transactional"
    templateName = "attendance_alert"
    language = "en"
    payload = @{
        student_name = "Rahul"
        status = "Absent"
        date = "2025-11-17"
    }
    recipients = @(
        @{
            phone = $TEST_PHONE_NUMBER
            name = "Test Parent"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4100/api/v1/message-jobs" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "✓ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
    Write-Host "Check WhatsApp for the message!" -ForegroundColor Green
}
catch {
    Write-Host "✗ Error!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message
    Write-Host ""
    if ($_.ErrorDetails.Message) {
        Write-Host "Server response:" -ForegroundColor Yellow
        $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10
    }
}
