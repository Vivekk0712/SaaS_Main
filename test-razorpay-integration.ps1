# Test Razorpay Integration Script
# This script tests if the Razorpay plugin is running and responding correctly

Write-Host "🧪 Testing Razorpay Integration..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if Razorpay plugin is running
Write-Host "Test 1: Checking Razorpay Plugin Health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:5002/health" -Method GET -UseBasicParsing
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "✅ Razorpay plugin is running on port 5002" -ForegroundColor Green
        $healthData = $healthResponse.Content | ConvertFrom-Json
        Write-Host "   Service: $($healthData.service)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Razorpay plugin is NOT running on port 5002" -ForegroundColor Red
    Write-Host "   Please start it with: cd razorpay_plugin && npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 2: Test create order endpoint
Write-Host "Test 2: Testing Create Order Endpoint..." -ForegroundColor Yellow
try {
    $orderBody = @{
        amount = 100
        currency = "INR"
        invoiceId = "TEST_INV_$(Get-Date -Format 'yyyyMMddHHmmss')"
        idempotencyKey = "TEST_KEY_$(Get-Date -Format 'yyyyMMddHHmmss')"
    } | ConvertTo-Json

    $orderResponse = Invoke-WebRequest -Uri "http://localhost:5002/api/payments/create-order" `
        -Method POST `
        -ContentType "application/json" `
        -Body $orderBody `
        -UseBasicParsing

    if ($orderResponse.StatusCode -eq 200) {
        Write-Host "✅ Create order endpoint is working" -ForegroundColor Green
        $orderData = $orderResponse.Content | ConvertFrom-Json
        Write-Host "   Order ID: $($orderData.orderId)" -ForegroundColor Gray
        Write-Host "   Amount: $($orderData.amount)" -ForegroundColor Gray
        Write-Host "   Currency: $($orderData.currency)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Create order endpoint failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 3: Check if main app can reach Razorpay plugin
Write-Host "Test 3: Testing Main App Integration..." -ForegroundColor Yellow
try {
    $mainAppResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/payments/create-order" `
        -Method POST `
        -ContentType "application/json" `
        -Body $orderBody `
        -UseBasicParsing

    if ($mainAppResponse.StatusCode -eq 200) {
        Write-Host "✅ Main app can communicate with Razorpay plugin" -ForegroundColor Green
        $mainAppData = $mainAppResponse.Content | ConvertFrom-Json
        Write-Host "   Integration is working correctly" -ForegroundColor Gray
    }
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "⚠️  Main app is not running on port 3000" -ForegroundColor Yellow
        Write-Host "   Please start it with: npm run dev:stack" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Main app integration failed" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Razorpay Integration Test Complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Start the main app: npm run dev:stack" -ForegroundColor White
Write-Host "2. Login as parent: http://localhost:3000/parent/login" -ForegroundColor White
Write-Host "3. Go to Payments page and click 'Pay Now'" -ForegroundColor White
Write-Host "4. Use test card: 4111 1111 1111 1111" -ForegroundColor White
Write-Host ""
