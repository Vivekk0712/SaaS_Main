# MCP Server Plugin - Quick Start Guide

Get up and running in 5 minutes.

## Prerequisites

- Python 3.10+
- MySQL 5.7+
- Gemini API key ([Get one here](https://ai.google.dev/))

## Step 1: Install

```bash
cd mcp_server_plugin
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

## Step 2: Configure

```bash
copy .env.example .env
```

Edit `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=school_erp
GEMINI_API_KEY=your_gemini_key_here
ERP_JWT_SECRET=your_secret_key
```

## Step 3: Setup Database

```bash
mysql -u root -p school_erp < sql/schema.sql
```

## Step 4: Run

```bash
python -m uvicorn src.main:app --reload --port 5003
```

Visit: http://localhost:5003/docs

## Step 5: Test

### Generate Test JWT

```python
import jwt
token = jwt.encode(
    {"sub": "teacher1", "roles": ["teacher"]},
    "your_secret_key",
    algorithm="HS256"
)
print(token)
```

### Make Test Query

```bash
curl -X POST http://localhost:5003/api/v1/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"Show me all classes\"}"
```

## Next Steps

- Read [README.md](./README.md) for full documentation
- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues

## Common Issues

### Database Connection Failed
- Check MySQL is running
- Verify credentials in `.env`
- Ensure database exists

### Invalid Token
- Check JWT secret matches
- Verify token format
- Ensure token includes `sub` and `roles`

### Module Not Found
- Activate virtual environment
- Run `pip install -r requirements.txt`

## Production Deployment

```bash
# Install gunicorn
pip install gunicorn

# Run with multiple workers
gunicorn src.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:5003
```

## Docker Deployment

```bash
docker build -t mcp-server .
docker run -p 5003:5003 --env-file .env mcp-server
```

That's it! You're ready to query your ERP database with natural language.
