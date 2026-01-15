# MCP Server Plugin - Troubleshooting Guide

## Common Issues and Solutions

### 1. Database Connection Issues

#### Error: "Database connection failed"

**Symptoms:**
- Server fails to start
- Health check returns `database: false`

**Solutions:**

1. **Check MySQL is running:**
```bash
# Windows
net start MySQL80

# Linux
sudo systemctl status mysql
```

2. **Verify credentials:**
```bash
mysql -h localhost -u erp_readonly -p
```

3. **Check database exists:**
```sql
SHOW DATABASES LIKE 'school_erp';
```

4. **Test connection from Python:**
```python
import aiomysql
import asyncio

async def test():
    conn = await aiomysql.connect(
        host='localhost',
        user='erp_readonly',
        password='your_password',
        db='school_erp'
    )
    print("Connected!")
    conn.close()

asyncio.run(test())
```

5. **Check firewall:**
```bash
# Windows
netsh advfirewall firewall show rule name=MySQL

# Linux
sudo ufw status
```

---

### 2. Authentication Issues

#### Error: "401 Unauthorized: Invalid or expired token"

**Symptoms:**
- All API requests return 401
- "Invalid token" error message

**Solutions:**

1. **Verify JWT secret matches:**
```python
# In your ERP system
JWT_SECRET = "same_secret_as_mcp_server"

# In .env
ERP_JWT_SECRET=same_secret_as_mcp_server
```

2. **Check token format:**
```python
import jwt
import json

token = "your_token_here"
decoded = jwt.decode(token, options={"verify_signature": False})
print(json.dumps(decoded, indent=2))

# Should include:
# {
#   "sub": "user_id",
#   "roles": ["teacher"],
#   "iss": "https://erp.example.com",
#   "aud": "erp_mcp"
# }
```

3. **Generate valid test token:**
```python
import jwt
from datetime import datetime, timedelta

token = jwt.encode(
    {
        "sub": "teacher123",
        "roles": ["teacher", "hod"],
        "iss": "https://erp.example.com",
        "aud": "erp_mcp",
        "exp": datetime.utcnow() + timedelta(hours=1)
    },
    "your_secret_key",
    algorithm="HS256"
)
print(token)
```

4. **Check token expiry:**
```python
import jwt
from datetime import datetime

decoded = jwt.decode(token, options={"verify_signature": False})
exp = datetime.fromtimestamp(decoded['exp'])
print(f"Token expires at: {exp}")
print(f"Current time: {datetime.utcnow()}")
```

---

### 3. Permission Issues

#### Error: "403 Forbidden: You don't have permission"

**Symptoms:**
- Token is valid but query is rejected
- "Permission denied" error

**Solutions:**

1. **Check user roles in token:**
```python
import jwt
decoded = jwt.decode(token, options={"verify_signature": False})
print(f"User roles: {decoded['roles']}")
```

2. **Verify intent permissions:**
See RBAC matrix in README.md

3. **Check allowed intents for role:**
```bash
curl -X GET http://localhost:5003/api/v1/intents \
  -H "Authorization: Bearer YOUR_TOKEN"
```

4. **Common role requirements:**
- `get_timetable`: student, teacher, hod, principal, admin
- `get_attendance`: teacher, hod, principal, admin (NOT student)
- `get_teacher_info`: hod, principal, admin (NOT teacher)
- `get_fee_status`: student (own only), accountant, principal, admin

---

### 4. Rate Limiting Issues

#### Error: "429 Too Many Requests"

**Symptoms:**
- Requests rejected after many queries
- "Rate limit exceeded" message

**Solutions:**

1. **Check current rate limits:**
```env
RATE_LIMIT_PER_MINUTE=30
RATE_LIMIT_PER_HOUR=500
```

2. **Increase limits (if needed):**
```env
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000
```

3. **Check audit logs:**
```sql
SELECT COUNT(*) as query_count, user_id
FROM mcp_audit_logs
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)
GROUP BY user_id;
```

4. **Implement client-side throttling:**
```javascript
// Add delay between requests
await new Promise(resolve => setTimeout(resolve, 2000));
```

---

### 5. Gemini API Issues

#### Error: "LLM generation failed"

**Symptoms:**
- Query returns data but answer is generic
- "Failed to generate answer" in logs

**Solutions:**

1. **Verify API key:**
```bash
curl -H "Authorization: Bearer YOUR_GEMINI_KEY" \
  https://generativelanguage.googleapis.com/v1/models
```

2. **Check API quota:**
Visit: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas

3. **Test Gemini directly:**
```python
import google.generativeai as genai

genai.configure(api_key="your_key")
model = genai.GenerativeModel("gemini-2.0-flash-exp")
response = model.generate_content("Hello")
print(response.text)
```

4. **Check model availability:**
```python
import google.generativeai as genai
genai.configure(api_key="your_key")
for model in genai.list_models():
    print(model.name)
```

5. **Fallback behavior:**
The system automatically falls back to simple formatting if Gemini fails. Check logs for details.

---

### 6. Query Intent Not Recognized

#### Error: "I couldn't understand your question"

**Symptoms:**
- Valid question but intent is "unknown"
- No results returned

**Solutions:**

1. **Use more specific keywords:**
```
❌ "Show me stuff for class 10"
✅ "Show me the timetable for class 10A"

❌ "Who's not here?"
✅ "Show attendance for class 10A today"
```

2. **Include context:**
```json
{
  "question": "Show me the timetable",
  "context": {
    "class_id": 10
  }
}
```

3. **Check supported intents:**
```bash
curl http://localhost:5003/api/v1/intents \
  -H "Authorization: Bearer YOUR_TOKEN"
```

4. **Review intent patterns:**
See `src/services/intent_extractor.py` for pattern matching rules.

---

### 7. No Data Returned

#### Error: "No records found in the database"

**Symptoms:**
- Query succeeds but returns no data
- Empty results

**Solutions:**

1. **Check database has data:**
```sql
SELECT COUNT(*) FROM students;
SELECT COUNT(*) FROM timetables;
SELECT COUNT(*) FROM attendance;
```

2. **Verify table names:**
```sql
SHOW TABLES;
```

3. **Check allowed tables:**
```env
ALLOWED_TABLES=students,teachers,timetables,attendance,subjects,classes,fees,exams
```

4. **Insert sample data:**
```sql
-- See sql/schema.sql for sample data
```

5. **Check query parameters:**
```python
# Enable debug logging
LOG_LEVEL=debug
```

---

### 8. Slow Response Times

#### Symptoms:
- Queries take > 3 seconds
- Timeout errors

**Solutions:**

1. **Check database indexes:**
```sql
SHOW INDEX FROM timetables;
SHOW INDEX FROM attendance;
```

2. **Add missing indexes:**
```sql
CREATE INDEX idx_class_date ON attendance(class_id, date);
CREATE INDEX idx_class_day ON timetables(class_id, day_of_week);
```

3. **Reduce MAX_ROWS_RETURNED:**
```env
MAX_ROWS_RETURNED=50  # Instead of 100
```

4. **Enable Redis caching:**
```env
REDIS_URL=redis://localhost:6379/0
CACHE_TTL=300
```

5. **Check Gemini latency:**
```python
import time
start = time.time()
response = model.generate_content("test")
print(f"Gemini latency: {time.time() - start}s")
```

---

### 9. Module Import Errors

#### Error: "ModuleNotFoundError: No module named 'fastapi'"

**Symptoms:**
- Server fails to start
- Import errors

**Solutions:**

1. **Activate virtual environment:**
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

2. **Reinstall dependencies:**
```bash
pip install -r requirements.txt
```

3. **Check Python version:**
```bash
python --version  # Should be 3.10+
```

4. **Verify installation:**
```bash
pip list | grep fastapi
pip list | grep google-generativeai
```

---

### 10. Audit Logging Issues

#### Error: "Failed to create audit log"

**Symptoms:**
- Queries work but not logged
- Audit table errors

**Solutions:**

1. **Check audit table exists:**
```sql
SHOW TABLES LIKE 'mcp_audit_logs';
```

2. **Create audit table:**
```bash
mysql -u root -p school_erp < sql/schema.sql
```

3. **Check audit DB permissions:**
```sql
SHOW GRANTS FOR 'erp_readonly'@'localhost';
-- Should have INSERT on mcp_audit_logs
```

4. **Grant audit permissions:**
```sql
GRANT INSERT ON school_erp.mcp_audit_logs TO 'erp_readonly'@'localhost';
FLUSH PRIVILEGES;
```

---

## Debugging Tips

### Enable Debug Logging

```env
LOG_LEVEL=debug
NODE_ENV=development
```

### Check Application Logs

```bash
# View logs in real-time
python -m uvicorn src.main:app --reload --log-level debug
```

### Test Database Queries Directly

```python
import asyncio
from src.config import db_pool
from src.services import database_service

async def test():
    await db_pool.connect()
    sql = "SELECT * FROM students LIMIT 5"
    results = await database_service.execute_query(sql, ())
    print(results)

asyncio.run(test())
```

### Test Intent Extraction

```python
from src.services import intent_extractor

result = intent_extractor.extract_intent(
    "Show me the timetable for class 10A"
)
print(f"Intent: {result.intent}")
print(f"Parameters: {result.parameters}")
print(f"Confidence: {result.confidence}")
```

### Monitor Database Connections

```sql
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Threads_connected';
```

---

## Getting Help

If you're still stuck:

1. **Check audit logs:**
```sql
SELECT * FROM mcp_audit_logs 
WHERE success = FALSE 
ORDER BY timestamp DESC 
LIMIT 10;
```

2. **Review application logs:**
Look for ERROR or WARNING messages

3. **Test with curl:**
```bash
curl -v -X POST http://localhost:5003/api/v1/query \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "test"}'
```

4. **Check health endpoint:**
```bash
curl http://localhost:5003/health
```

5. **Verify environment:**
```bash
python -c "from src.config import settings; print(settings.dict())"
```

---

## Performance Benchmarks

Expected performance:
- Database query: 10-50ms
- Gemini API call: 200-500ms
- Total response time: 500-1500ms
- Throughput: 100+ queries/second

If you're seeing worse performance, check:
- Database indexes
- Network latency
- Gemini API quota
- Server resources (CPU/RAM)
