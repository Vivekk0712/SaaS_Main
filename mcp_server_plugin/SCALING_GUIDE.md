# MCP Server - Scaling Guide

## How It Handles Large Databases

### Current Approach: Hybrid System

The system uses a **2-tier approach**:

1. **Pattern Matching** (Fast, Secure)
   - Tries simple regex patterns first
   - No API calls needed
   - Instant response

2. **LLM Intent Extraction** (Flexible, Fallback)
   - If patterns fail, uses Gemini
   - Understands complex questions
   - Extracts names, dates, etc.

### Security Model

✅ **Still Secure** - Even with LLM:
- LLM only extracts intent + parameters
- SQL queries are still predefined templates
- Uses parameterized queries (LIKE patterns)
- No arbitrary SQL execution

### Example Flow:

**Question:** "What's the designation of Jane?"

1. Pattern matching fails ❌
2. LLM extracts:
   ```json
   {
     "intent": "get_teacher_info",
     "parameters": {
       "teacher_name": "Jane"
     }
   }
   ```
3. System uses predefined SQL:
   ```sql
   SELECT ... FROM teachers 
   WHERE first_name LIKE '%Jane%' 
   OR last_name LIKE '%Jane%'
   ```
4. Safe and flexible! ✅

## Now These Work:

### Student Queries
- "List all students with class id 1" ✅
- "Find student named Aditya" ✅
- "Show me students in Class 10A" ✅
- "Get details of roll number 2024001" ✅

### Teacher Queries
- "What's the designation of Jane?" ✅
- "Who teaches Mathematics?" ✅
- "Show me all teachers in Science department" ✅
- "Find teacher named John" ✅

### Flexible Queries
- "Show me all classes" ✅
- "List pending fees" ✅
- "Get today's attendance" ✅

## Scaling to Large Databases

### 1. Query Limits
```python
MAX_ROWS_RETURNED=100  # Configurable in .env
```

### 2. Indexed Columns
Make sure these are indexed:
```sql
CREATE INDEX idx_student_name ON students(first_name, last_name);
CREATE INDEX idx_teacher_name ON teachers(first_name, last_name);
CREATE INDEX idx_class_id ON students(class_id);
```

### 3. Pagination (Future)
For very large results, add pagination:
```python
# In query parameters
{
  "question": "List all students",
  "page": 1,
  "per_page": 50
}
```

### 4. Caching
Enable Redis for repeated queries:
```env
REDIS_URL=redis://localhost:6379/0
CACHE_TTL=300  # 5 minutes
```

### 5. Read Replicas
For high load, use database read replicas:
```env
DB_HOST=read-replica.example.com
```

## Performance Tips

### Fast Queries (< 50ms)
- Use indexed columns
- Limit results
- Simple WHERE clauses

### Slow Queries (> 500ms)
- Add database indexes
- Reduce MAX_ROWS_RETURNED
- Use more specific queries

## Cost Management

### Pattern Matching
- **Cost**: $0 (no API calls)
- **Speed**: Instant
- **Coverage**: ~70% of queries

### LLM Fallback
- **Cost**: ~$0.0001 per query
- **Speed**: 200-500ms
- **Coverage**: 100% of queries

### Optimization
- Pattern matching handles common queries (free)
- LLM handles complex queries (pennies)
- Best of both worlds!

## Adding New Query Types

### Option 1: Add Pattern (Fast)
```python
# In intent_extractor.py
Intent.GET_GRADES: [
    r"grade|marks|score|result",
    r"show.*grade|get.*marks"
]
```

### Option 2: Let LLM Handle It
Just add the SQL template - LLM will understand automatically!

```python
# In query_planner.py
Intent.GET_GRADES: """
    SELECT student_id, subject, grade, marks
    FROM grades
    WHERE student_id = %s OR class_id = %s
    LIMIT %s
"""
```

## Monitoring

### Track These Metrics:
- Pattern match success rate
- LLM fallback usage
- Query response times
- Database query times
- Cache hit rates

### Optimize Based On:
- If LLM usage > 50%: Add more patterns
- If queries slow: Add indexes
- If costs high: Increase cache TTL

## Summary

✅ **Secure**: Predefined SQL templates only
✅ **Flexible**: LLM understands natural language
✅ **Fast**: Pattern matching for common queries
✅ **Scalable**: Handles large databases with indexes
✅ **Cost-effective**: Hybrid approach minimizes API calls

The system is designed to scale from small schools (100s of records) to large universities (100,000s of records) without code changes!
