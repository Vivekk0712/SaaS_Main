# MCP Server Plugin

AI-powered natural language database querying for School ERP systems.

## Overview

The MCP Server Plugin enables teachers, administrators, and staff to query the ERP database using natural language questions. It uses Google's Gemini 2.0 Flash for understanding and generation, while maintaining strict security controls.

## Features

- 🔒 **Secure**: Read-only database access, no arbitrary SQL
- 🎯 **Role-based**: Different permissions for different user roles
- 🤖 **AI-powered**: Natural language understanding with Gemini
- 📊 **Audit trail**: Every query logged for compliance
- ⚡ **Fast**: Async operations and connection pooling
- 🛡️ **Safe**: Parameterized queries only, no SQL injection

## Quick Start

### Prerequisites

- Python 3.10 or higher
- MySQL 5.7 or higher
- Google Gemini API key
- ERP system with JWT authentication

### Installation

```bash
# Clone or navigate to the plugin directory
cd mcp_server_plugin

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Configuration

1. Copy the example environment file:
```bash
copy .env.example .env
```

2. Edit `.env` and fill in your configuration:
```env
# Database (read-only user)
DB_HOST=localhost
DB_USER=erp_readonly
DB_PASSWORD=your_password
DB_NAME=school_erp

# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# ERP Authentication
ERP_JWT_SECRET=your_jwt_secret
```

3. Set up the database:
```bash
mysql -u root -p < sql/schema.sql
```

### Running

Development mode:
```bash
python -m uvicorn src.main:app --reload --port 5003
```

Production mode:
```bash
python -m uvicorn src.main:app --host 0.0.0.0 --port 5003
```

The server will start at `http://localhost:5003`

## Usage

### API Endpoint

**POST** `/api/v1/query`

Request:
```json
{
  "question": "Show me the timetable for Class 10A tomorrow",
  "context": {
    "class_id": 10
  }
}
```

Response:
```json
{
  "answer": "Tomorrow's timetable for Class 10A includes:\n- 9:00 AM: Mathematics (Mr. John Doe)\n- 10:30 AM: Physics (Ms. Jane Smith)...",
  "sources": [
    {"table": "timetables", "row_id": 123}
  ],
  "confidence": 0.85,
  "rows_count": 5,
  "intent": "get_timetable"
}
```

### Example Questions

**For Teachers:**
- "Show me attendance for Class 10A today"
- "What's the timetable for Class 9B tomorrow?"
- "Get contact details for student with roll number 2024001"

**For Accountants:**
- "How many students have pending fees in Class 10?"
- "Show fee status for student ID 123"

**For Principals:**
- "How many students are in each class?"
- "Show me all teachers in the Mathematics department"
- "What exams are scheduled for next week?"

## Supported Intents

| Intent | Description | Allowed Roles |
|--------|-------------|---------------|
| `get_timetable` | Class schedule | Student, Teacher, HOD, Principal, Admin |
| `get_attendance` | Attendance records | Teacher, HOD, Principal, Admin |
| `get_student_info` | Student details | Teacher, HOD, Principal, Accountant, Admin |
| `get_teacher_info` | Teacher details | HOD, Principal, Admin |
| `get_fee_status` | Fee payment status | Student (own), Accountant, Principal, Admin |
| `get_exam_schedule` | Exam schedule | Student, Teacher, HOD, Principal, Admin |
| `get_class_info` | Class information | Teacher, HOD, Principal, Accountant, Admin |
| `get_subject_info` | Subject details | Teacher, HOD, Principal, Admin |

## Security

### Authentication
- JWT tokens from ERP system
- Token must include `user_id` and `roles`
- Verified using shared secret

### Authorization
- Role-based access control (RBAC)
- Each intent has allowed roles
- Students can only access their own data

### Database Security
- Read-only database user
- Parameterized queries only
- No arbitrary SQL execution
- Limited to allowed tables

### Rate Limiting
- 30 queries per minute per user
- 500 queries per hour per user
- Prevents abuse and cost overruns

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## Database Schema

The plugin requires an audit logging table. See [sql/schema.sql](./sql/schema.sql) for the complete schema.

Key tables:
- `mcp_audit_logs` - Query audit trail
- `students`, `teachers`, `classes` - ERP data (adjust to your schema)
- `timetables`, `attendance`, `fees`, `exams` - ERP data

## Configuration Options

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 5003 | Server port |
| `DB_HOST` | Yes | - | MySQL host |
| `DB_USER` | Yes | - | Database user (read-only) |
| `DB_PASSWORD` | Yes | - | Database password |
| `DB_NAME` | Yes | - | Database name |
| `GEMINI_API_KEY` | Yes | - | Google Gemini API key |
| `GEMINI_MODEL` | No | gemini-2.0-flash-exp | Gemini model to use |
| `ERP_JWT_SECRET` | Yes | - | JWT secret for verification |
| `ALLOWED_TABLES` | No | students,teachers,... | Comma-separated allowed tables |
| `MAX_ROWS_RETURNED` | No | 100 | Maximum rows per query |
| `RATE_LIMIT_PER_MINUTE` | No | 30 | Queries per minute per user |

## Integration with ERP

### 1. Generate JWT Token

Your ERP backend should generate JWT tokens:

```javascript
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    sub: userId,
    roles: ['teacher', 'hod'],
    iss: 'https://erp.example.com',
    aud: 'erp_mcp'
  },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);
```

### 2. Call MCP API

From your frontend:

```javascript
const response = await fetch('http://localhost:5003/api/v1/query', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    question: userQuestion,
    context: { class_id: currentClassId }
  })
});

const data = await response.json();
displayAnswer(data.answer);
```

### 3. Database Setup

Create a read-only MySQL user:

```sql
CREATE USER 'erp_readonly'@'localhost' IDENTIFIED BY 'secure_password';
GRANT SELECT ON school_erp.* TO 'erp_readonly'@'localhost';
FLUSH PRIVILEGES;
```

## Monitoring

### Health Check

```bash
curl http://localhost:5003/health
```

Response:
```json
{
  "status": "healthy",
  "service": "mcp-server-plugin",
  "database": true,
  "timestamp": "2024-11-27T10:30:00Z"
}
```

### Logs

Logs are written to stdout in JSON format (production) or human-readable format (development).

### Audit Logs

All queries are logged in the `mcp_audit_logs` table:

```sql
SELECT * FROM mcp_audit_logs 
WHERE user_id = 'teacher123' 
ORDER BY timestamp DESC 
LIMIT 10;
```

## Troubleshooting

### Database Connection Failed

**Error**: `Database connection failed`

**Solution**:
1. Check database credentials in `.env`
2. Ensure MySQL is running
3. Verify network connectivity
4. Check firewall rules

### Invalid Token

**Error**: `401 Unauthorized: Invalid or expired token`

**Solution**:
1. Verify JWT secret matches ERP system
2. Check token expiry
3. Ensure token includes required fields (`sub`, `roles`)

### Permission Denied

**Error**: `403 Forbidden: You don't have permission`

**Solution**:
1. Check user roles in JWT token
2. Verify intent is allowed for user role
3. See RBAC matrix in documentation

### Rate Limit Exceeded

**Error**: `429 Too Many Requests`

**Solution**:
1. Wait before retrying
2. Increase rate limits in `.env` if needed
3. Check for infinite loops in client code

## Development

### Project Structure

```
mcp_server_plugin/
├── src/
│   ├── config/          # Configuration and setup
│   ├── domain/          # Data models and types
│   ├── middleware/      # Authentication middleware
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   └── main.py          # Application entry point
├── sql/
│   └── schema.sql       # Database schema
├── .env.example         # Example configuration
├── requirements.txt     # Python dependencies
└── README.md
```

### Adding New Intents

1. Add intent to `src/domain/types.py`:
```python
class Intent(str, Enum):
    GET_NEW_INTENT = "get_new_intent"
```

2. Add SQL template to `src/services/query_planner.py`:
```python
SQL_TEMPLATES = {
    Intent.GET_NEW_INTENT: "SELECT ... WHERE ... LIMIT %s"
}
```

3. Add role permissions:
```python
ROLE_PERMISSIONS = {
    UserRole.TEACHER: [Intent.GET_NEW_INTENT, ...]
}
```

4. Add parameter builder:
```python
def _build_parameters(self, intent, params):
    if intent == Intent.GET_NEW_INTENT:
        return (params.get("id"), max_rows)
```

## Testing

### Manual Testing

Use curl or Postman:

```bash
curl -X POST http://localhost:5003/api/v1/query \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Show me the timetable for Class 10A",
    "context": {"class_id": 10}
  }'
```

### Unit Tests

```bash
pytest tests/
```

## Performance

- **Response time**: Typically 500-1500ms
- **Throughput**: 100+ queries/second
- **Database**: Connection pooling (1-10 connections)
- **LLM**: Gemini 2.0 Flash (~200ms latency)

## Cost Estimation

### Gemini API Costs
- Model: Gemini 2.0 Flash
- Input: ~500 tokens per query
- Output: ~200 tokens per response
- Cost: ~$0.0001 per query
- 10,000 queries/month ≈ $1

### Infrastructure
- Server: 1 CPU, 1GB RAM sufficient
- Database: Minimal load (read-only)
- Total: ~$10-20/month

## Support

For issues or questions:
1. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation
2. Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
3. Check audit logs for error details
4. Contact your ERP system administrator

## License

This plugin is part of the School ERP system.

## Version

Current version: 0.1.0

## Changelog

### 0.1.0 (2024-11-27)
- Initial release
- Support for 8 core intents
- JWT authentication
- Role-based access control
- Gemini 2.0 Flash integration
- Audit logging
- Rate limiting
