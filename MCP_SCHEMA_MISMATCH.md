# MCP Server Schema Mismatch - Quick Fix

## Issue
The MCP server's pre-built SQL queries expect a different database schema than your actual `sas` database.

## What Happened
✅ **Fixed:** Audit table created successfully  
❌ **Issue:** Attendance query failed because:
- MCP expects: `attendance.date`
- Your DB has: `attendance.ymd`

## Your Actual Schema
```sql
attendance table:
- id (bigint)
- ymd (date)          ← Different from MCP's expected 'date'
- class_id (bigint)
- section_id (bigint)
- hour_no (tinyint)
- subject_id (bigint)
```

## Quick Solutions

### Option 1: Use Simple Test Queries (Recommended for Now)
Try these questions that work with your schema:

**Working queries:**
- "How many students are there?" 
- "Show me all classes"
- "List all teachers"
- "Show me all subjects"

**Avoid for now:**
- Attendance queries (schema mismatch)
- Complex date-based queries

### Option 2: Update MCP Server Queries
The MCP server needs to be configured to match your actual database schema. This requires:

1. Checking your complete database schema
2. Updating SQL templates in `mcp_server_plugin/src/services/query_planner.py`
3. Mapping your actual table structures

### Option 3: Test with Direct Database Query
You can test if the MCP server works with simpler queries:

```
Question: "How many classes are there?"
Expected: Should work fine

Question: "Show me all students"
Expected: Should work if students table exists
```

## Current Status

✅ MCP Server running on port 5003  
✅ Authentication bypassed in dev mode  
✅ Audit table created  
✅ UI pages working  
❌ Need to match SQL queries to your schema  

## Next Steps

1. **Test with simple queries first** - Try "How many students are there?"
2. **Check what tables you have:**
   ```sql
   SHOW TABLES;
   ```
3. **Update MCP queries** to match your schema (if needed)

## Temporary Workaround

For immediate testing, you can ask questions about:
- Students count
- Classes list
- Teachers list
- Any table that matches the expected schema

The MCP server will work once the SQL queries are updated to match your actual database structure!
