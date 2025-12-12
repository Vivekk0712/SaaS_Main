# Test WhatsApp API Credentials
# This script verifies your Phone Number ID and Access Token

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "WhatsApp Credentials Test" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Load .env file
$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "✗ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file from .env.example" -ForegroundColor Yellow
    exit 1
}

# Parse .env file
$env:PHONE_ID = ""
$env:TOKEN = ""

Get-Content $envFile | ForEach-Object {
    if ($_ -match "^WHATSAPP_TEST_PHONE_NUMBER_ID=(.+)$") {
        $env:PHONE_ID = $matches[1].Trim()
    }
    if ($_ -match "^WHATSAPP_ACCESS_TOKEN=(.+)$") {
        $env:TOKEN = $matches[1].Trim()
    }
}

# Validate credentials exist
if ([string]::IsNullOrWhiteSpace($env:PHONE_ID)) {
    Write-Host "✗ Error: WHATSAPP_TEST_PHONE_NUMBER_ID not found in .env" -ForegroundColor Red
    exit 1
}

if ([string]::IsNullOrWhiteSpace($env:TOKEN)) {
    Write-Host "✗ Error: WHATSAPP_ACCESS_TOKEN not found in .env" -ForegroundColor Red
    exit 1
}

Write-Host "Phone Number ID: $($env:PHONE_ID)" -ForegroundColor Gray
Write-Host "Access Token: $($env:TOKEN.Substring(0, 20))..." -ForegroundColor Gray
Write-Host ""

# Test credentials
Write-Host "Testing credentials with Meta API..." -ForegroundColor Yellow

$url = "https://graph.facebook.com/v20.0/$($env:PHONE_ID)"
$headers = @{
    "Authorization" = "Bearer $($env:TOKEN)"
}

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
    
    Write-Host "✓ Credentials are VALID!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Business Details:" -ForegroundColor Cyan
    Write-Host "  Name: $($response.verified_name)" -ForegroundColor White
    Write-Host "  Phone: $($response.display_phone_number)" -ForegroundColor White
    Write-Host "  Quality: $($response.quality_rating)" -ForegroundColor White
    Write-Host "  ID: $($response.id)" -ForegroundColor White
    Write-Host ""
    Write-Host "✓ You can now test sending messages!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Run: npm run dev" -ForegroundColor White
    Write-Host "  2. Open: http://localhost:4100" -ForegroundColor White
    Write-Host "  3. Test with hello_world template first" -ForegroundColor White
    
} catch {
    Write-Host "✗ Credentials are INVALID!" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Yellow
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errorBody = $reader.ReadToEnd() | ConvertFrom-Json
            
            Write-Host ""
            Write-Host "Error Details:" -ForegroundColor Yellow
            Write-Host "  Message: $($errorBody.error.message)" -ForegroundColor White
            Write-Host "  Type: $($errorBody.error.type)" -ForegroundColor White
            Write-Host "  Code: $($errorBody.error.code)" -ForegroundColor White
            
            Write-Host ""
            Write-Host "Common Causes:" -ForegroundColor Yellow
            Write-Host "  1. Access token expired (temporary tokens last 24 hours)" -ForegroundColor White
            Write-Host "  2. Wrong Phone Number ID" -ForegroundColor White
            Write-Host "  3. Missing permissions on the token" -ForegroundColor White
            Write-Host ""
            Write-Host "Solution:" -ForegroundColor Yellow
            Write-Host "  1. Go to: https://business.facebook.com/" -ForegroundColor White
            Write-Host "  2. Navigate to: WhatsApp → API Setup" -ForegroundColor White
            Write-Host "  3. Copy the Phone Number ID" -ForegroundColor White
            Write-Host "  4. Generate a new Temporary Access Token" -ForegroundColor White
            Write-Host "  5. Update your .env file" -ForegroundColor White
            Write-Host "  6. Run this script again to verify" -ForegroundColor White
            Write-Host ""
            Write-Host "See FIX_CREDENTIALS_ERROR.md for detailed instructions" -ForegroundColor Cyan
            
        } catch {
            Write-Host "Could not parse error response" -ForegroundColor Red
        }
    } else {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
