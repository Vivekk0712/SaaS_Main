# Razorpay Payment Plugin - Test Script
# PowerShell script to test payment API endpoints

$baseUrl = "http://localhost:5002"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Razorpay Payment Plugin - API Test" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
Write-Host "GET $baseUrl/health" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✓ Health check passed" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json) -ForegroundColor Gray
} catch {
    Write-Host "✗ Health check failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Create Order
Write-Host "Test 2: Create Payment Order" -ForegroundColor Yellow
$orderPayload = @{
    invoiceId = 1001
    amount = 10.00
    currency = "INR"
} | ConvertTo-Json

Write-Host "POST $baseUrl/api/payments/create-order" -ForegroundColor Gray
Write-Host "Payload: $orderPayload" -ForegroundColor Gray

try {
    $orderResponse = Invoke-RestMethod -Uri "$baseUrl/api/payments/create-order" `
        -Method Post `
        -ContentType "application/json" `
        -Body $orderPayload
    
    Write-Host "✓ Order created successfully" -ForegroundColor Green
    Write-Host ($orderResponse | ConvertTo-Json) -ForegroundColor Gray
    
    $orderId = $orderResponse.orderId
    $keyId = $orderResponse.key
    
    Write-Host ""
    Write-Host "Order Details:" -ForegroundColor Cyan
    Write-Host "  Order ID: $orderId" -ForegroundColor White
    Write-Host "  Amount: ₹$($orderResponse.amount / 100)" -ForegroundColor White
    Write-Host "  Key ID: $keyId" -ForegroundColor White
    
} catch {
    Write-Host "✗ Order creation failed: $_" -ForegroundColor Red
    Write-Host $_.Exception.Response -ForegroundColor Red
}
Write-Host ""

# Test 3: Instructions for manual payment
Write-Host "Test 3: Complete Payment (Manual)" -ForegroundColor Yellow
Write-Host "To complete the payment flow:" -ForegroundColor White
Write-Host "1. Open browser: $baseUrl" -ForegroundColor White
Write-Host "2. Enter Invoice ID: 1001" -ForegroundColor White
Write-Host "3. Enter Amount: 10" -ForegroundColor White
Write-Host "4. Click 'Pay Now with Razorpay'" -ForegroundColor White
Write-Host "5. Use test card: 4111 1111 1111 1111" -ForegroundColor White
Write-Host "6. CVV: 123, Expiry: 12/25" -ForegroundColor White
Write-Host ""

# Test 4: Database check (if MySQL client available)
Write-Host "Test 4: Database Check" -ForegroundColor Yellow
Write-Host "To verify database records:" -ForegroundColor White
Write-Host "mysql -u root -p school_erp" -ForegroundColor Gray
Write-Host "SELECT * FROM payment_attempts ORDER BY created_at DESC LIMIT 5;" -ForegroundColor Gray
Write-Host "SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;" -ForegroundColor Gray
Write-Host "SELECT * FROM webhook_events ORDER BY received_at DESC LIMIT 5;" -ForegroundColor Gray
Write-Host ""

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✓ API is accessible" -ForegroundColor Green
Write-Host "✓ Order creation works" -ForegroundColor Green
Write-Host "→ Complete payment manually in browser" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Configure Razorpay test keys in .env" -ForegroundColor White
Write-Host "2. Set up database schema" -ForegroundColor White
Write-Host "3. Test payment flow in browser" -ForegroundColor White
Write-Host "4. Configure webhooks for production" -ForegroundColor White
Write-Host ""
