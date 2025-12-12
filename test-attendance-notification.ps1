# Test script for attendance notification feature
# This script tests the API endpoint with sample data

Write-Host "🧪 Testing Attendance Notification API" -ForegroundColor Cyan
Write-Host ""

# Configuration
$API_URL = "http://localhost:3000/api/attendance/notify"
$WHATSAPP_PLUGIN_URL = "http://localhost:4100"

# Test data
$testData = @{
    date = "2025-12-12"
    klass = "Class 10"
    section = "A"
    hour = 1
    absentStudents = @("101", "102", "103")
} | ConvertTo-Json

Write-Host "📋 Test Configuration:" -ForegroundColor Yellow
Write-Host "  API URL: $API_URL"
Write-Host "  WhatsApp Plugin: $WHATSAPP_PLUGIN_URL"
Write-Host ""

# Check if WhatsApp plugin is running
Write-Host "1️⃣ Checking WhatsApp plugin..." -ForegroundColor Cyan
try {
    $healthCheck = Invoke-RestMethod -Uri "$WHATSAPP_PLUGIN_URL/health" -Method Get -ErrorAction Stop
    Write-Host "  ✅ WhatsApp plugin is running" -ForegroundColor Green
    Write-Host "     Status: $($healthCheck.status)" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ WhatsApp plugin is not running!" -ForegroundColor Red
    Write-Host "     Please start it with: cd whatsapp_plugin && npm start" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check if main app is running
Write-Host "2️⃣ Checking main app..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  ✅ Main app is running" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Main app is not running!" -ForegroundColor Red
    Write-Host "     Please start it with: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test the API endpoint
Write-Host "3️⃣ Testing attendance notification API..." -ForegroundColor Cyan
Write-Host "  Request body:" -ForegroundColor Gray
Write-Host "  $testData" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $API_URL -Method Post -Body $testData -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "  ✅ API call successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  📊 Results:" -ForegroundColor Yellow
    Write-Host "     Success: $($response.success)" -ForegroundColor Gray
    Write-Host "     Sent: $($response.sent)" -ForegroundColor Gray
    Write-Host "     Skipped: $($response.skipped)" -ForegroundColor Gray
    Write-Host "     Message: $($response.message)" -ForegroundColor Gray
    
    if ($response.details) {
        Write-Host ""
        Write-Host "  📝 Details:" -ForegroundColor Yellow
        
        if ($response.details.sent -and $response.details.sent.Count -gt 0) {
            Write-Host "     Sent to:" -ForegroundColor Gray
            foreach ($student in $response.details.sent) {
                Write-Host "       - $($student.name) ($($student.usn))" -ForegroundColor Green
            }
        }
        
        if ($response.details.skipped -and $response.details.skipped.Count -gt 0) {
            Write-Host "     Skipped:" -ForegroundColor Gray
            foreach ($student in $response.details.skipped) {
                Write-Host "       - $($student.name) ($($student.usn)) - $($student.reason)" -ForegroundColor Yellow
            }
        }
    }
    
    Write-Host ""
    Write-Host "✅ Test completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "  ❌ API call failed!" -ForegroundColor Red
    Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "     Details: $($errorDetails.message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "❌ Test failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 All tests passed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Check database for student-parent relationships" -ForegroundColor Gray
Write-Host "  2. Verify parent phone numbers are populated" -ForegroundColor Gray
Write-Host "  3. Test in the UI: Teacher → Attendance" -ForegroundColor Gray
Write-Host "  4. Mark some students absent and click 'Send Notifications'" -ForegroundColor Gray
