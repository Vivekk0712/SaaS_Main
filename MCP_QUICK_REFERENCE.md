# MCP Database Chat - Quick Reference Card

## 🚀 Quick Start (3 Steps)

### 1. Install Dependencies
```powershell
cd mcp_server_plugin
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Add Gemini API Key
Edit `mcp_server_plugin/.env`:
```env
GEMINI_API_KEY=your_key_from_google
```
Get key: https://makersuite.google.com/app/apikey

### 3. Start Everything
```powershell
npm run dev:stack
```

## 📍 URLs

| Page | URL | Who |
|------|-----|-----|
| Teacher Chat | http://localhost:3000/teacher/database-chat | Teachers |
| HOD Dashboard | http://localhost:3000/hod/dashboard | HOD |
| HOD Chat | http://localhost:3000/hod/database-chat | HOD |
| MCP Server | http://localhost:5003 | Backend |
| Health Check | http://localhost:5003/health | Testing |

## 💬 Example Questions

### Teachers
```
Show me attendance for my class today
What's the timetable for tomorrow?
How many students are in CLASS 10-A?
List students with pending assignments
Show me exam schedule for next week
```

### HOD
```
Show me all teachers
How many students per class?
List pending fee payments
Compare section performance
Show attendance trends
Which teachers have the best attendance rates?
```

## 🧪 Test It

```powershell
# Run integration tests
.\test-mcp-integration.ps1

# Test MCP server health
curl http://localhost:5003/health

# Test direct query
$body = @{ question = "How many students?" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5003/api/v1/query" -Method POST -Body $body -ContentType "application/json" -Headers @{"Authorization"="Bearer dev-token"}
```

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| MCP won't start | `cd mcp_server_plugin && pip install -r requirements.txt` |
| No Gemini key | Get from https://makersuite.google.com/app/apikey |
| Port 5003 in use | `netstat -ano \| findstr :5003` then `taskkill /PID <PID> /F` |
| DB connection error | Check `mcp_server_plugin/.env` credentials |
| 500 error | Check MCP server logs in terminal |

## 📁 Key Files

```
.env                                          # Add MCP_SERVER_URL
mcp_server_plugin/.env                        # Configure Gemini + DB
scripts/dev-all.mjs                           # Dev stack (includes MCP)
apps/frontend-next/src/app/
  ├── teacher/database-chat/page.tsx          # Teacher UI
  ├── hod/dashboard/page.tsx                  # HOD dashboard
  ├── hod/database-chat/page.tsx              # HOD chat UI
  └── api/database-chat/route.ts              # API endpoint
```

## 🔐 Environment Variables

### Root `.env`
```env
MCP_SERVER_URL=http://localhost:5003
```

### `mcp_server_plugin/.env`
```env
DB_HOST=127.0.0.1
DB_USER=sas_app
DB_PASSWORD=9482824040
DB_NAME=sas
GEMINI_API_KEY=your_key_here
PORT=5003
```

## 🎯 Features

- ✅ Natural language queries
- ✅ AI-powered (Gemini 2.0 Flash)
- ✅ Role-based permissions
- ✅ Read-only database access
- ✅ Real-time chat UI
- ✅ Intent detection
- ✅ Audit logging
- ✅ Rate limiting

## 💰 Cost

- **Gemini API:** ~$0.0001/query
- **10,000 queries:** ~$1/month
- **Very affordable!**

## 📚 Documentation

- `MCP_INTEGRATION_SUMMARY.md` - Overview
- `MCP_DATABASE_CHAT_SETUP.md` - Detailed setup
- `mcp_server_plugin/README.md` - Full MCP docs
- `mcp_server_plugin/ARCHITECTURE.md` - Technical details

## 🆘 Need Help?

1. Run `.\test-mcp-integration.ps1`
2. Check MCP server logs
3. Read `MCP_DATABASE_CHAT_SETUP.md`
4. Check `mcp_server_plugin/TROUBLESHOOTING.md`

---

**That's it!** Get your Gemini API key, start the services, and you're ready to chat with your database! 🎉
