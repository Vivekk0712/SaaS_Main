# Test MCP Server Query Endpoint
# PowerShell script for Windows

Write-Host "=== MCP Server Query Test ===" -ForegroundColor Cyan

# Configuration
$BASE_URL = "http://localhost:5003"
$JWT_SECRET = "your_secret_key"  # Change this to match your .env

# Generate test JWT token
Write-Host "`nGenerating test JWT token..." -ForegroundColor Yellow

$payload = @{
    sub = "teacher123"
    roles = @("teacher", "hod")
    iss = "https://erp.example.com"
    aud = "erp_mcp"
    exp = [int][double]::Parse((Get-Date).AddHours(1).ToString("yyyyMMddHHmmss"))
} | ConvertTo-Json

# Note: For production, use a proper JWT library
# This is a simplified test token
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZWFjaGVyMTIzIiwicm9sZXMiOlsidGVhY2hlciIsImhvZCJdLCJpc3MiOiJodHRwczovL2VycC5leGFtcGxlLmNvbSIsImF1ZCI6ImVycF9tY3AifQ.SIGNATURE"

Write-Host "Token: $token" -ForegroundColor Gray

# Test 1: Health Check
Write-Host "`n[Test 1] Health Check" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/health" -Method Get
    Write-Host "Status: $($response.status)" -ForegroundColor Green
    Write-Host "Database: $($response.database)" -ForegroundColor Green
} catch {
    Write-Host "Health check failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: List Intents
Write-Host "`n[Test 2] List Intents" -ForegroundColor Green
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/intents" -Method Get -Headers $headers
    Write-Host "Available intents:" -ForegroundColor Cyan
    $response.intents.PSObject.Properties | ForEach-Object {
        Write-Host "  - $($_.Name): $($_.Value)" -ForegroundColor Gray
    }
} catch {
    Write-Host "List intents failed: $_" -ForegroundColor Red
}

# Test 3: Query - Timetable
Write-Host "`n[Test 3] Query - Get Timetable" -ForegroundColor Green
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    $body = @{
        question = "Show me the timetable for Class 10A"
        context = @{
            class_id = 1
        }
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/query" -Method Post -Headers $headers -Body $body
    Write-Host "Intent: $($response.intent)" -ForegroundColor Cyan
    Write-Host "Rows: $($response.rows_count)" -ForegroundColor Cyan
    Write-Host "Confidence: $($response.confidence)" -ForegroundColor Cyan
    Write-Host "`nAnswer:" -ForegroundColor Yellow
    Write-Host $response.answer -ForegroundColor White
} catch {
    Write-Host "Query failed: $_" -ForegroundColor Red
    Write-Host $_.Exception.Response.StatusCode -ForegroundColor Red
}

# Test 4: Query - Attendance
Write-Host "`n[Test 4] Query - Get Attendance" -ForegroundColor Green
try {
    $body = @{
        question = "Show me attendance for Class 10A today"
        context = @{
            class_id = 1
        }
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/query" -Method Post -Headers $headers -Body $body
    Write-Host "Intent: $($response.intent)" -ForegroundColor Cyan
    Write-Host "Rows: $($response.rows_count)" -ForegroundColor Cyan
    Write-Host "`nAnswer:" -ForegroundColor Yellow
    Write-Host $response.answer -ForegroundColor White
} catch {
    Write-Host "Query failed: $_" -ForegroundColor Red
}

# Test 5: Query - Student Info
Write-Host "`n[Test 5] Query - Get Student Info" -ForegroundColor Green
try {
    $body = @{
        question = "Get details of student with roll number 2024001"
        context = @{
            roll_number = "2024001"
        }
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BASE_URL/api/v1/query" -Method Post -Headers $headers -Body $body
    Write-Host "Intent: $($response.intent)" -ForegroundColor Cyan
    Write-Host "Rows: $($response.rows_count)" -ForegroundColor Cyan
    Write-Host "`nAnswer:" -ForegroundColor Yellow
    Write-Host $response.answer -ForegroundColor White
} catch {
    Write-Host "Query failed: $_" -ForegroundColor Red
}

Write-Host "`n=== Tests Complete ===" -ForegroundColor Cyan
Write-Host "`nNote: Some tests may fail if database is empty or JWT token is invalid" -ForegroundColor Yellow
Write-Host "Update JWT_SECRET in this script to match your .env file" -ForegroundColor Yellow
