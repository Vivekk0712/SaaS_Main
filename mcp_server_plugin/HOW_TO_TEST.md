# How to Test MCP Server - Simple Guide

## Step 1: Generate Token

```powershell
python quick-token.py
```

Copy the token that appears.

## Step 2: Open UI

Open browser: **http://localhost:5003**

## Step 3: Paste Token

1. Paste the token in the "JWT Token" field
2. Select "Teacher" as user role

## Step 4: Try Questions

Click on example questions or type:

### Working Questions:
- "Show me the timetable for Class 10A"
- "Show attendance for Class 10A today"
- "How many students have pending fees?"
- "When is the next exam for Class 10A?"

### For Student Info (now fixed):
- "Get details of student with roll number 2024001"
- "Show me student information"

## Common Issues:

### ❌ "I couldn't understand your question"
**Fix**: The question pattern doesn't match. Try:
- "Show me the timetable" instead of "Give me timetable"
- "Show attendance" instead of "Check attendance"

### ❌ Gemini Quota Exceeded
**Fix**: You hit the free tier limit. The system will show raw data instead.
- Wait 1 minute and try again
- Or use a different Gemini API key
- Data still works, just not AI-formatted

### ❌ "Invalid token"
**Fix**: 
1. Check JWT_SECRET in `.env` matches
2. Generate new token with `python quick-token.py`
3. Make sure token is not expired

### ❌ "Permission denied"
**Fix**: Generate token with more roles:
```python
python quick-token.py  # Already includes teacher, hod, principal
```

## What's Working:

✅ Server is running
✅ Health check works
✅ Database connected
✅ UI loads
✅ Token generation works
✅ Queries execute (even without AI formatting)

## Note About Gemini:

The error you saw:
```
429 You exceeded your current quota
```

This means you hit the free tier limit (15 requests per minute).

**Solutions:**
1. Wait 1 minute between queries
2. System still works - shows raw data instead of AI-formatted
3. Get a paid Gemini API key for unlimited use
4. Use a different API key

The plugin works fine - it just can't format answers nicely when quota is exceeded. You still get the data!
