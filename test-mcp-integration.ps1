# Test MCP Database Chat Integration
Write-Host "=== Testing MCP Database Chat Integration ===" -ForegroundColor Cyan

# Test 1: Check if MCP server is running
Write-Host "`n1. Testing MCP Server Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5003/health" -Method GET
    Write-Host "✓ MCP Server is healthy" -ForegroundColor Green
    Write-Host "  Status: $($health.status)" -ForegroundColor Gray
    Write-Host "  Database: $($health.database)" -ForegroundColor Gray
} catch {
    Write-Host "✗ MCP Server is not running on port 5003" -ForegroundColor Red
    Write-Host "  Start it with: cd mcp_server_plugin && python -m uvicorn src.main:app --reload --port 5003" -ForegroundColor Yellow
    exit 1
}

# Test 2: Test direct MCP query
Write-Host "`n2. Testing Direct MCP Query..." -ForegroundColor Yellow
try {
    $body = @{
        question = "How many students are there?"
        context = @{
            role = "teacher"
        }
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:5003/api/v1/query" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -Headers @{
            "Authorization" = "Bearer dev-token"
        }

    Write-Host "✓ Direct MCP query successful" -ForegroundColor Green
    Write-Host "  Answer: $($response.answer)" -ForegroundColor Gray
    Write-Host "  Intent: $($response.intent)" -ForegroundColor Gray
    Write-Host "  Confidence: $($response.confidence)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Direct MCP query failed" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
}

# Test 3: Test frontend API endpoint
Write-Host "`n3. Testing Frontend API Endpoint..." -ForegroundColor Yellow
try {
    $body = @{
        question = "Show me all teachers"
        role = "hod"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/database-chat" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body

    Write-Host "✓ Frontend API query successful" -ForegroundColor Green
    Write-Host "  Answer: $($response.answer)" -ForegroundColor Gray
    Write-Host "  Intent: $($response.intent)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Frontend API query failed" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    Write-Host "  Make sure frontend is running on port 3000" -ForegroundColor Yellow
}

# Test 4: Check environment variables
Write-Host "`n4. Checking Environment Variables..." -ForegroundColor Yellow
$envContent = Get-Content .env -Raw
if ($envContent -match "MCP_SERVER_URL") {
    Write-Host "✓ MCP_SERVER_URL is set in .env" -ForegroundColor Green
} else {
    Write-Host "✗ MCP_SERVER_URL not found in .env" -ForegroundColor Red
}

# Test 5: Check MCP plugin .env
Write-Host "`n5. Checking MCP Plugin Configuration..." -ForegroundColor Yellow
if (Test-Path "mcp_server_plugin\.env") {
    $mcpEnv = Get-Content "mcp_server_plugin\.env" -Raw
    
    if ($mcpEnv -match "GEMINI_API_KEY") {
        Write-Host "✓ GEMINI_API_KEY is configured" -ForegroundColor Green
    } else {
        Write-Host "✗ GEMINI_API_KEY not found in mcp_server_plugin\.env" -ForegroundColor Red
        Write-Host "  Get one from: https://makersuite.google.com/app/apikey" -ForegroundColor Yellow
    }
    
    if ($mcpEnv -match "DB_HOST") {
        Write-Host "✓ Database configuration found" -ForegroundColor Green
    } else {
        Write-Host "✗ Database configuration missing" -ForegroundColor Red
    }
} else {
    Write-Host "✗ mcp_server_plugin\.env not found" -ForegroundColor Red
    Write-Host "  Copy from .env.example and configure" -ForegroundColor Yellow
}

# Test 6: Check if pages exist
Write-Host "`n6. Checking UI Pages..." -ForegroundColor Yellow
$pages = @(
    "apps/frontend-next/src/app/teacher/database-chat/page.tsx",
    "apps/frontend-next/src/app/hod/database-chat/page.tsx",
    "apps/frontend-next/src/app/hod/dashboard/page.tsx",
    "apps/frontend-next/src/app/api/database-chat/route.ts"
)

foreach ($page in $pages) {
    if (Test-Path $page) {
        Write-Host "✓ $page exists" -ForegroundColor Green
    } else {
        Write-Host "✗ $page missing" -ForegroundColor Red
    }
}

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Teacher Chat: http://localhost:3000/teacher/database-chat" -ForegroundColor White
Write-Host "HOD Dashboard: http://localhost:3000/hod/dashboard" -ForegroundColor White
Write-Host "HOD Chat: http://localhost:3000/hod/database-chat" -ForegroundColor White
Write-Host "`nTo start all services: npm run dev:stack" -ForegroundColor Yellow
