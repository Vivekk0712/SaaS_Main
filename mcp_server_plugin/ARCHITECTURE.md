# MCP Server Plugin - Architecture

## Overview

The MCP Server Plugin is a Python-based FastAPI service that enables natural language querying of the School ERP database. It uses Google's Gemini 2.0 Flash for natural language understanding and generation, while maintaining strict security controls over database access.

## Technology Stack

- **Runtime**: Python 3.10+
- **Framework**: FastAPI
- **Database**: MySQL 5.7+ (read-only access)
- **LLM**: Google Gemini 2.0 Flash
- **Authentication**: JWT (from ERP system)
- **Caching**: Redis (optional)
- **Logging**: Python logging with structured output

## Architecture Principles

### 1. Security First
- **No arbitrary SQL**: LLM never writes or executes raw SQL
- **Parameterized queries only**: All SQL uses prepared statements
- **Read-only database user**: Cannot modify data
- **Role-based access control**: Users only see what they're allowed to
- **Audit logging**: Every query is logged

### 2. Controlled AI
- **Predefined intents**: Limited set of supported query types
- **SQL templates**: Each intent maps to a specific SQL template
- **Grounded responses**: LLM only uses provided database results
- **No hallucination**: If data isn't available, say so explicitly

### 3. Performance
- **Connection pooling**: Efficient database connections
- **Rate limiting**: Prevent abuse
- **Caching**: Optional Redis for repeated queries
- **Async operations**: Non-blocking I/O

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ERP Frontend                            │
│                  (React/Vue/Angular)                        │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP + JWT
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  MCP Server (FastAPI)                       │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Auth         │  │ Intent       │  │ Query           │  │
│  │ Middleware   │→ │ Extractor    │→ │ Planner         │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│                                              ↓              │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Database     │← │ LLM Service  │← │ Database        │  │
│  │ Service      │  │ (Gemini)     │  │ Results         │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│         ↓                                    ↓              │
│  ┌──────────────┐                    ┌─────────────────┐  │
│  │ Audit        │                    │ Response        │  │
│  │ Service      │                    │ Builder         │  │
│  └──────────────┘                    └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         ↓                                      ↓
┌─────────────────┐                    ┌─────────────────┐
│ MySQL (ERP DB)  │                    │ Audit DB        │
│ (Read-Only)     │                    │ (Logs)          │
└─────────────────┘                    └─────────────────┘
```

## Core Components

### 1. Configuration Layer (`src/config/`)

#### env.py
- Environment variable validation using Pydantic
- Type-safe configuration access
- Validates all required credentials on startup

#### logger.py
- Structured logging
- JSON format in production
- Human-readable in development

#### database.py
- Connection pool management
- Separate pools for main DB and audit DB
- Automatic reconnection handling

### 2. Domain Layer (`src/domain/`)

#### types.py
Defines all data models:
- `UserRole`: Enum of user roles (student, teacher, HOD, etc.)
- `Intent`: Enum of supported query intents
- `QueryRequest`: Incoming query from user
- `QueryResponse`: Response with answer and metadata
- `AuditLog`: Audit log entry structure

### 3. Middleware Layer (`src/middleware/`)

#### auth.py
- JWT token verification
- Extracts user_id and roles
- Validates token signature and expiry
- Integrates with ERP's authentication system

### 4. Services Layer (`src/services/`)

#### intent_extractor.py
Converts natural language to structured intent:
- Pattern matching for common queries
- Extracts parameters (class_id, date, etc.)
- Returns intent + confidence score
- Can be enhanced with LLM for complex queries

#### query_planner.py
Maps intents to safe SQL:
- Maintains SQL templates for each intent
- Enforces role-based permissions
- Builds parameterized query parameters
- Never allows arbitrary SQL

#### database_service.py
Executes database queries:
- Uses parameterized queries only
- Returns results as list of dictionaries
- Handles connection errors gracefully
- Provides schema introspection

#### llm_service.py
Generates natural language responses:
- Formats database results for LLM context
- Builds prompts with strict instructions
- Uses Gemini 2.0 Flash for generation
- Includes fallback for LLM failures

#### audit_service.py
Logs all queries:
- Records user, question, intent, results
- Tracks success/failure
- Measures response time
- Supports rate limiting checks

### 5. Routes Layer (`src/routes/`)

#### query.py
API endpoints:
- `POST /api/v1/query` - Main query endpoint
- `GET /api/v1/intents` - List supported intents

## Request Flow

### 1. Query Processing Flow

```
User Question
    ↓
[1] JWT Authentication
    ↓
[2] Rate Limit Check
    ↓
[3] Intent Extraction
    ↓
[4] Permission Check
    ↓
[5] SQL Template Selection
    ↓
[6] Parameter Building
    ↓
[7] Database Query Execution
    ↓
[8] LLM Answer Generation
    ↓
[9] Response Building
    ↓
[10] Audit Logging
    ↓
JSON Response
```

### 2. Detailed Steps

**Step 1: Authentication**
- Verify JWT token from Authorization header
- Extract user_id and roles
- Reject if invalid or expired

**Step 2: Rate Limiting**
- Check query count in last minute
- Enforce per-user limits
- Return 429 if exceeded

**Step 3: Intent Extraction**
- Analyze question using pattern matching
- Extract parameters (class_id, date, etc.)
- Return intent + confidence

**Step 4: Permission Check**
- Verify user role allows this intent
- Example: Students can't access teacher info
- Return 403 if not allowed

**Step 5: SQL Template Selection**
- Get predefined SQL for intent
- Templates are hardcoded and safe
- No dynamic SQL generation

**Step 6: Parameter Building**
- Fill SQL parameters from extracted data
- Apply defaults where needed
- Validate parameter types

**Step 7: Database Execution**
- Execute parameterized query
- Limit rows returned (MAX_ROWS_RETURNED)
- Handle database errors

**Step 8: LLM Generation**
- Format results for LLM context
- Build prompt with strict instructions
- Call Gemini API
- Parse response

**Step 9: Response Building**
- Combine answer with metadata
- Include sources (table + row IDs)
- Add confidence score

**Step 10: Audit Logging**
- Log complete request/response
- Record timing and success
- Store in audit database

## Supported Intents

### 1. get_timetable
**Purpose**: Get class schedule/timetable
**Permissions**: Student, Teacher, HOD, Principal, Admin
**Parameters**: class_id
**Example**: "Show me the timetable for Class 10A"

### 2. get_attendance
**Purpose**: Get attendance records
**Permissions**: Teacher, HOD, Principal, Admin
**Parameters**: class_id, date
**Example**: "Show attendance for Class 10A today"

### 3. get_student_info
**Purpose**: Get student details
**Permissions**: Teacher, HOD, Principal, Accountant, Admin
**Parameters**: student_id or roll_number
**Example**: "Get phone number of student with roll number 2024001"

### 4. get_teacher_info
**Purpose**: Get teacher details
**Permissions**: HOD, Principal, Admin
**Parameters**: teacher_id or employee_id
**Example**: "Show me details of teacher T001"

### 5. get_fee_status
**Purpose**: Get fee payment status
**Permissions**: Student (own), Accountant, Principal, Admin
**Parameters**: student_id or class_id
**Example**: "How many students have pending fees in Class 10A?"

### 6. get_exam_schedule
**Purpose**: Get exam schedule
**Permissions**: Student, Teacher, HOD, Principal, Admin
**Parameters**: class_id
**Example**: "When is the next exam for Class 10A?"

### 7. get_class_info
**Purpose**: Get class information
**Permissions**: Teacher, HOD, Principal, Accountant, Admin
**Parameters**: class_id
**Example**: "How many students are in Class 10A?"

### 8. get_subject_info
**Purpose**: Get subject details
**Permissions**: Teacher, HOD, Principal, Admin
**Parameters**: subject_id or subject_code
**Example**: "Who teaches Mathematics?"

## Security Model

### 1. Authentication
- JWT tokens issued by ERP system
- Tokens contain user_id and roles
- Verified using shared secret or public key
- Expired tokens rejected

### 2. Authorization (RBAC)
- Each intent has allowed roles
- Checked before query execution
- Row-level security for sensitive data
- Students see only their own data

### 3. SQL Injection Prevention
- No raw SQL from user input
- All queries use parameterized statements
- SQL templates are hardcoded
- Parameters validated before use

### 4. Data Access Control
- Read-only database user
- Limited to specific tables (ALLOWED_TABLES)
- Cannot execute DDL or DML
- Maximum rows limit enforced

### 5. Audit Trail
- Every query logged with user_id
- Includes question, intent, SQL, results
- Timestamps and response times
- Success/failure tracking

## Database Schema

### Audit Logs Table
```sql
CREATE TABLE mcp_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    roles JSON NOT NULL,
    question TEXT NOT NULL,
    intent VARCHAR(50) NOT NULL,
    parameters JSON,
    sql_template TEXT,
    rows_returned INT DEFAULT 0,
    success BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    response_time_ms INT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## LLM Prompting Strategy

### System Instruction
```
You are a factual assistant for a School ERP system.

CRITICAL RULES:
1. Use ONLY the data provided in the 'DATABASE RESULTS' section
2. Do NOT guess, invent, or assume any information
3. If data is insufficient, say "I don't have enough information"
4. Provide brief, clear answers
5. Include source references [table:row_id]
6. Do NOT output sensitive fields
7. Format responses professionally
```

### Context Format
- Database results formatted as structured records
- Limited to 50 rows to prevent token overflow
- Includes all relevant columns
- Datetime values converted to ISO format

### Generation Config
- Temperature: 0.1 (very low for factual responses)
- Max tokens: 500 (concise answers)
- Model: gemini-2.0-flash-exp (fast and cost-effective)

## Error Handling

### API Errors
- 400: Invalid request (validation failed)
- 401: Unauthorized (invalid/missing token)
- 403: Forbidden (permission denied)
- 429: Too many requests (rate limit)
- 500: Internal server error

### Database Errors
- Connection failures logged and retried
- Query errors return safe error message
- Audit log records failures

### LLM Errors
- Fallback to simple result formatting
- Error logged but request succeeds
- User gets data even if LLM fails

## Deployment

### Environment Setup
1. Python 3.10+ installed
2. MySQL database with read-only user
3. Gemini API key
4. ERP JWT secret/public key

### Installation
```bash
cd mcp_server_plugin
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Configuration
1. Copy `.env.example` to `.env`
2. Fill in all required values
3. Run database schema: `mysql < sql/schema.sql`

### Running
```bash
# Development
python -m uvicorn src.main:app --reload --port 5003

# Production
gunicorn src.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:5003
```

### Docker (Recommended)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "5003"]
```

## Integration with ERP

### 1. Authentication Setup
- ERP generates JWT tokens for users
- Tokens include user_id and roles
- MCP server validates using shared secret
- Token expiry enforced

### 2. API Integration
```javascript
// Frontend example
const response = await fetch('http://localhost:5003/api/v1/query', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    question: "Show me the timetable for Class 10A",
    context: { class_id: 10 }
  })
});

const data = await response.json();
console.log(data.answer);
```

### 3. Database Setup
- Create read-only MySQL user
- Grant SELECT on required tables only
- Optionally use read replica
- Run schema.sql for audit table

## Monitoring & Observability

### Metrics to Track
- Query success rate
- Average response time
- Database query latency
- LLM API latency
- Rate limit hits
- Error rates by type

### Logging
- Structured JSON logs in production
- Request/response logging
- Error stack traces
- Performance metrics

### Health Checks
- `GET /health` endpoint
- Database connectivity test
- Returns status + timestamp

## Performance Optimization

### 1. Caching (Optional)
- Redis for repeated queries
- Cache key: hash(user_scope + intent + params)
- TTL: 5 minutes (configurable)
- Invalidate on data changes

### 2. Connection Pooling
- Min 1, Max 10 connections
- Automatic reconnection
- Connection timeout handling

### 3. Query Optimization
- Indexed columns in WHERE clauses
- LIMIT enforced on all queries
- Avoid SELECT *
- Use covering indexes

### 4. Rate Limiting
- Per-user: 30 queries/minute
- Per-role: 500 queries/hour
- Prevents abuse and cost overruns

## Future Enhancements

1. **Advanced Intent Extraction**: Use LLM for complex query understanding
2. **Multi-table Joins**: Support queries spanning multiple tables
3. **Aggregations**: Support COUNT, SUM, AVG queries
4. **Time-series Analysis**: Trend analysis over time
5. **Export Functionality**: Download results as CSV/Excel
6. **Voice Interface**: Speech-to-text integration
7. **Multi-language**: Support regional languages
8. **Caching Layer**: Redis for performance
9. **Analytics Dashboard**: Query patterns and usage stats
10. **Webhook Notifications**: Alert on specific conditions

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Google Gemini API](https://ai.google.dev/docs)
- [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- Architecture Document: `doc/mcp_server_plugin.md`
