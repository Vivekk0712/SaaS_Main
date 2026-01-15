# Quick Test Guide

## 1. Install Missing Package

```powershell
pip install PyJWT
```

## 2. Start Server

```powershell
python -m uvicorn src.main:app --reload --port 5003
```

## 3. Test Health Endpoint

Open browser: http://localhost:5003/health

Or use curl:
```powershell
curl http://localhost:5003/health
```

## 4. Test UI

Open browser: http://localhost:5003

## 5. Generate Test Token (Optional)

```powershell
python -c "import jwt; print(jwt.encode({'sub': 'test123', 'roles': ['teacher']}, 'test_secret', algorithm='HS256'))"
```

## 6. Test Query (with token)

```powershell
$token = "YOUR_TOKEN_HERE"
$body = @{
    question = "Show me all classes"
    context = @{}
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5003/api/v1/query" `
  -Method Post `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body $body
```

## Quick Fix Commands

```powershell
# If JWT error
pip install PyJWT python-jose[cryptography]

# If database error
# Check your .env file has correct DB credentials

# If Gemini error  
# Check your .env file has GEMINI_API_KEY
```
