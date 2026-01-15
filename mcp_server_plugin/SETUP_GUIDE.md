# MCP Server Plugin - Complete Setup Guide

This guide will walk you through setting up the MCP Server Plugin from scratch.

## Prerequisites

Before you begin, ensure you have:

- ✅ Python 3.10 or higher
- ✅ MySQL 5.7 or higher
- ✅ Google Gemini API key ([Get one here](https://ai.google.dev/))
- ✅ Access to your ERP database
- ✅ Basic command line knowledge

## Step 1: Install Python Dependencies

### Windows

```powershell
# Navigate to plugin directory
cd mcp_server_plugin

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

### Linux/Mac

```bash
# Navigate to plugin directory
cd mcp_server_plugin

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

## Step 2: Configure Environment Variables

### Create .env file

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

### Edit .env file

Open `.env` in your text editor and configure:

#### Database Configuration (Required)

```env
# Main Database (Read-Only User)
DB_HOST=localhost
DB_PORT=3306
DB_USER=erp_readonly
DB_PASSWORD=your_secure_password
DB_NAME=school_erp
```

#### Gemini AI Configuration (Required)

```env
# Get your API key from https://ai.google.dev/
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp
GEMINI_TEMPERATURE=0.1
GEMINI_MAX_TOKENS=500
```

#### ERP Authentication (Required)

```env
# JWT Configuration
ERP_JWT_SECRET=your_jwt_secret_key
ERP_JWT_ISSUER=https://erp.example.com
ERP_JWT_AUDIENCE=erp_mcp
```

#### Server Configuration (Optional)

```env
# Server Settings
PORT=5003
NODE_ENV=development
LOG_LEVEL=info

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000
```

#### Security Settings (Optional)

```env
# Allowed database tables (comma-separated)
ALLOWED_TABLES=students,teachers,timetables,attendance,subjects,classes,fees,exams

# Maximum rows returned per query
MAX_ROWS_RETURNED=100

# Rate Limiting
RATE_LIMIT_PER_MINUTE=30
RATE_LIMIT_PER_HOUR=500
```

#### Redis Cache (Optional)

```env
# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379/0
CACHE_TTL=300
```

## Step 3: Setup Database

### Create Read-Only Database User

```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create read-only user
CREATE USER 'erp_readonly'@'localhost' IDENTIFIED BY 'secure_password_here';

-- Grant SELECT permission on ERP database
GRANT SELECT ON school_erp.* TO 'erp_readonly'@'localhost';

-- Grant INSERT permission on audit table (for logging)
GRANT INSERT ON school_erp.mcp_audit_logs TO 'erp_readonly'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### Run Database Schema

```bash
# Import schema (creates audit table)
mysql -u root -p school_erp < sql/schema.sql
```

### Verify Database Setup

```sql
-- Connect to database
mysql -u erp_readonly -p school_erp

-- Check tables exist
SHOW TABLES;

-- Check audit table structure
DESCRIBE mcp_audit_logs;

-- Check sample data (optional)
SELECT COUNT(*) FROM students;
SELECT COUNT(*) FROM teachers;
SELECT COUNT(*) FROM timetables;

-- Exit
EXIT;
```

## Step 4: Get Gemini API Key

### Option 1: Google AI Studio (Free Tier)

1. Visit https://ai.google.dev/
2. Click "Get API Key"
3. Sign in with Google account
4. Create new API key
5. Copy the key to your `.env` file

### Option 2: Google Cloud Console

1. Visit https://console.cloud.google.com/
2. Create or select a project
3. Enable "Generative Language API"
4. Create credentials (API Key)
5. Copy the key to your `.env` file

### Test Gemini API Key

```python
# test_gemini.py
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.0-flash-exp")

response = model.generate_content("Hello, are you working?")
print(response.text)
```

Run test:
```bash
python test_gemini.py
```

## Step 5: Configure JWT Authentication

### Generate JWT Secret

```python
# generate_secret.py
import secrets
print(secrets.token_urlsafe(32))
```

Run:
```bash
python generate_secret.py
```

Copy the output to `ERP_JWT_SECRET` in `.env`

### Test JWT Token Generation

```bash
# Generate test token
python generate-token.py
```

Follow the prompts to create a test token.

## Step 6: Start the Server

### Development Mode

```bash
# Make sure virtual environment is activated
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# Start server with auto-reload
python -m uvicorn src.main:app --reload --port 5003
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:5003
INFO:     Application startup complete.
```

### Production Mode

```bash
# Install gunicorn
pip install gunicorn

# Start with multiple workers
gunicorn src.main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:5003 \
  --access-logfile - \
  --error-logfile -
```

## Step 7: Verify Installation

### Check Health Endpoint

```bash
curl http://localhost:5003/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "mcp-server-plugin",
  "database": true,
  "timestamp": "2024-11-27T10:30:00Z"
}
```

### Open Test UI

Open your browser and navigate to:
```
http://localhost:5003
```

You should see the MCP Server test interface.

### Test API Documentation

Visit:
```
http://localhost:5003/docs
```

This shows the interactive API documentation (Swagger UI).

## Step 8: Test with Sample Query

### Generate Test Token

```bash
python generate-token.py
```

Enter:
- User ID: `teacher123`
- Roles: `2,3` (teacher, hod)
- JWT Secret: (from your .env)

Copy the generated token.

### Test Query via Test UI

1. Open http://localhost:5003
2. Paste the JWT token
3. Select user role: "Teacher"
4. Click an example question or type your own
5. Click "Ask Question"

### Test Query via curl

```bash
curl -X POST http://localhost:5003/api/v1/query \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Show me the timetable for Class 10A",
    "context": {"class_id": 1}
  }'
```

### Test Query via PowerShell

```powershell
.\test-query.ps1
```

## Step 9: Insert Sample Data (Optional)

If your database is empty, insert sample data:

```sql
-- Connect to database
mysql -u root -p school_erp

-- Insert sample classes
INSERT INTO classes (name, section, academic_year) VALUES
('10', 'A', '2024-2025'),
('10', 'B', '2024-2025'),
('9', 'A', '2024-2025');

-- Insert sample teachers
INSERT INTO teachers (employee_id, first_name, last_name, email, department, designation) VALUES
('T001', 'John', 'Doe', 'john.doe@school.com', 'Mathematics', 'Senior Teacher'),
('T002', 'Jane', 'Smith', 'jane.smith@school.com', 'Science', 'HOD');

-- Insert sample subjects
INSERT INTO subjects (name, code, credits, teacher_id) VALUES
('Mathematics', 'MATH101', 4, 1),
('Physics', 'PHY101', 4, 2),
('Chemistry', 'CHEM101', 4, 2);

-- Insert sample students
INSERT INTO students (roll_number, first_name, last_name, email, class_id) VALUES
('2024001', 'Aditya', 'Sharma', 'aditya@example.com', 1),
('2024002', 'Priya', 'Patel', 'priya@example.com', 1),
('2024003', 'Rahul', 'Kumar', 'rahul@example.com', 2);

-- Insert sample timetable
INSERT INTO timetables (class_id, subject_id, teacher_id, day_of_week, start_time, end_time) VALUES
(1, 1, 1, 1, '09:00:00', '10:00:00'),
(1, 2, 2, 1, '10:30:00', '11:30:00');

-- Insert sample attendance
INSERT INTO attendance (student_id, class_id, date, status) VALUES
(1, 1, CURDATE(), 'present'),
(2, 1, CURDATE(), 'present'),
(3, 2, CURDATE(), 'absent');

-- Exit
EXIT;
```

## Step 10: Integration with ERP

### In Your ERP Backend (Node.js Example)

```javascript
// Generate JWT token for user
const jwt = require('jsonwebtoken');

function generateMCPToken(userId, roles) {
  return jwt.sign(
    {
      sub: userId,
      roles: roles,
      iss: process.env.ERP_JWT_ISSUER,
      aud: 'erp_mcp'
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// API endpoint to query MCP server
app.post('/api/mcp/query', async (req, res) => {
  const { question, context } = req.body;
  const token = generateMCPToken(req.user.id, req.user.roles);
  
  const response = await fetch('http://localhost:5003/api/v1/query', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ question, context })
  });
  
  const data = await response.json();
  res.json(data);
});
```

### In Your ERP Frontend (React Example)

```javascript
// Component for MCP queries
function MCPQueryBox() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/mcp/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question,
          context: { class_id: currentClassId }
        })
      });
      
      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      console.error('Query failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <textarea 
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a question..."
      />
      <button onClick={handleQuery} disabled={loading}>
        {loading ? 'Processing...' : 'Ask'}
      </button>
      {answer && <div className="answer">{answer}</div>}
    </div>
  );
}
```

## Troubleshooting

### Issue: Database Connection Failed

**Solution:**
1. Check MySQL is running: `mysql -u root -p`
2. Verify credentials in `.env`
3. Test connection: `mysql -u erp_readonly -p school_erp`

### Issue: Invalid Token Error

**Solution:**
1. Verify JWT secret matches in ERP and MCP server
2. Check token format with `generate-token.py`
3. Ensure token includes `sub` and `roles`

### Issue: Module Not Found

**Solution:**
1. Activate virtual environment
2. Run `pip install -r requirements.txt`
3. Check Python version: `python --version` (should be 3.10+)

### Issue: Gemini API Error

**Solution:**
1. Verify API key is correct
2. Check quota at https://console.cloud.google.com/
3. Test with `test_gemini.py`

For more issues, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## Next Steps

1. ✅ Configure production environment variables
2. ✅ Set up monitoring and logging
3. ✅ Configure HTTPS/SSL
4. ✅ Set up backup for audit logs
5. ✅ Configure rate limiting for production
6. ✅ Set up alerts for errors
7. ✅ Document custom intents (if added)
8. ✅ Train users on query patterns

## Production Deployment

See [README.md](./README.md) for Docker deployment instructions.

## Support

- Documentation: See README.md, ARCHITECTURE.md
- Issues: Check TROUBLESHOOTING.md
- Testing: Use test UI at http://localhost:5003

---

**Setup Complete!** 🎉

Your MCP Server Plugin is now ready to use.
