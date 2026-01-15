# MCP Database Chat - Capabilities & Limitations

## ✅ What CAN Be Answered (Current Intents)

### 1. **Attendance Queries** (`GET_ATTENDANCE`)
**Can answer:**
- "Show me attendance for CLASS 1 on 15-01-2026"
- "Who was absent today in CLASS 10?"
- "Show me attendance for yesterday"

**Limitations:**
- Only specific date queries (not date ranges)
- Requires class_id to be extracted from question
- Cannot show attendance trends over time
- Cannot calculate attendance percentages

### 2. **Student Information** (`GET_STUDENT_INFO`)
**Can answer:**
- "Show me all students in CLASS 1"
- "Find student with USN 2024001"
- "List all students"
- "Show me student named Rahul"

**Limitations:**
- Cannot filter by multiple criteria at once
- Cannot show student performance history
- Cannot show parent/guardian information
- Cannot show student photos or documents

### 3. **Teacher Information** (`GET_TEACHER_INFO`)
**Can answer:**
- "Show me all teachers"
- "Find teacher named John"
- "List all teachers"

**Limitations:**
- Cannot show teacher schedules
- Cannot show teacher workload
- Cannot show teacher qualifications
- Cannot show department hierarchy

### 4. **Class Information** (`GET_CLASS_INFO`)
**Can answer:**
- "How many students are in CLASS 1?"
- "Show me information about CLASS 10"
- "List all classes"

**Limitations:**
- Cannot show class timetables
- Cannot show class performance metrics
- Cannot compare classes
- Cannot show section-wise breakdown

### 5. **Subject Information** (`GET_SUBJECT_INFO`)
**Can answer:**
- "Show me all subjects"
- "Find subject Mathematics"
- "Who teaches Physics?"

**Limitations:**
- Cannot show subject syllabus
- Cannot show subject performance
- Cannot show subject materials

### 6. **Fee Status** (`GET_FEE_STATUS`)
**Can answer:**
- "Show me fee status for student 123"
- "Which students have pending fees in CLASS 1?"

**Limitations:**
- Cannot calculate total pending fees
- Cannot show payment history
- Cannot show fee structure
- Cannot generate fee reports

### 7. **Exam Schedule** (`GET_EXAM_SCHEDULE`)
**Can answer:**
- "Show me exam schedule for CLASS 10"
- "What exams are coming up?"

**Limitations:**
- Cannot show exam results
- Cannot show marks/grades
- Cannot compare exam performance
- Cannot show exam statistics

### 8. **Timetable** (`GET_TIMETABLE`)
**Can answer:**
- "Show me timetable for CLASS 1"
- "What's the schedule for CLASS 10?"

**Limitations:**
- Cannot show teacher-specific timetables
- Cannot show room allocations
- Cannot show substitutions

---

## ❌ What CANNOT Be Answered (Not Implemented)

### 1. **Complex Analytics**
**Cannot answer:**
- "What's the average attendance rate this month?"
- "Show me performance trends over the last semester"
- "Which class has the best attendance?"
- "Compare marks between sections"
- "Show me top 10 students by marks"

**Why:** Requires aggregation queries and complex calculations not in current intents

### 2. **Date Range Queries**
**Cannot answer:**
- "Show me attendance from Jan 1 to Jan 15"
- "List all exams this month"
- "Show me fee payments in the last quarter"

**Why:** Current queries only support single date parameters

### 3. **Multi-Table Complex Queries**
**Cannot answer:**
- "Show me students who were absent more than 5 times this month"
- "List teachers teaching more than 3 subjects"
- "Find students with pending fees and low attendance"

**Why:** Requires complex JOINs and subqueries not in templates

### 4. **Calculations & Aggregations**
**Cannot answer:**
- "Calculate total fees collected this month"
- "What's the student-teacher ratio?"
- "Show me average marks by subject"
- "How many students passed the exam?"

**Why:** No aggregation functions in current queries

### 5. **Data Modifications**
**Cannot answer:**
- "Mark student as present"
- "Update fee status"
- "Add new student"
- "Delete attendance record"

**Why:** Read-only by design (security feature)

### 6. **Document/File Queries**
**Cannot answer:**
- "Show me student photos"
- "Get assignment PDFs"
- "Show me uploaded documents"
- "Display gallery images"

**Why:** Only queries database tables, not file storage

### 7. **Real-Time/Live Data**
**Cannot answer:**
- "Who is currently in class?"
- "Show me live attendance"
- "What's happening right now?"

**Why:** No real-time data integration

### 8. **Predictive/AI Queries**
**Cannot answer:**
- "Which students are at risk of failing?"
- "Predict attendance for next week"
- "Recommend students for remedial classes"

**Why:** No ML/AI models integrated

### 9. **Cross-System Queries**
**Cannot answer:**
- "Show me WhatsApp messages sent to parents"
- "Get payment gateway transactions"
- "Show me RAG chatbot conversations"

**Why:** Only queries main ERP database, not plugin databases

### 10. **Unstructured Data**
**Cannot answer:**
- "What did the teacher write in the diary?"
- "Show me circular content"
- "What's in the announcement?"

**Why:** Can retrieve records but not analyze text content

---

## 🔧 How to Extend Capabilities

### Adding New Intents

To add support for new question types:

1. **Define new intent** in `src/domain/types.py`:
```python
class Intent(str, Enum):
    GET_MARKS = "get_marks"  # New intent
```

2. **Add SQL template** in `src/services/query_planner.py`:
```python
Intent.GET_MARKS: """
    SELECT m.marks, s.name, sub.name as subject
    FROM mark_entries m
    JOIN students s ON m.student_id = s.id
    JOIN subjects sub ON m.subject_id = sub.id
    WHERE s.id = %s
    LIMIT %s
"""
```

3. **Add parameter builder**:
```python
elif intent == Intent.GET_MARKS:
    student_id = params.get("student_id", 0)
    return (student_id, max_rows)
```

4. **Add to role permissions**:
```python
UserRole.TEACHER: [
    Intent.GET_MARKS,  # Add here
    # ... other intents
]
```

5. **Update intent extractor** to recognize the new question patterns

### Example: Adding Marks Query

**Question:** "Show me marks for student 123"

**Steps:**
1. Add `GET_MARKS` intent
2. Create SQL joining `mark_entries`, `students`, `subjects`
3. Extract student_id from question
4. Return formatted results

---

## 📊 Current Database Coverage

### Tables Currently Queryable:
✅ students  
✅ teachers  
✅ classes  
✅ sections  
✅ subjects  
✅ attendance  
✅ attendance_entries  
✅ invoices (fees)  
✅ tests (exams)  
✅ teaching_assignments  

### Tables NOT Queryable:
❌ diaries  
❌ circulars  
❌ materials  
❌ gallery_*  
❌ payments  
❌ mark_entries  
❌ mark_sheets  
❌ calendar_events  
❌ applications  
❌ parents  
❌ rag_* (chatbot data)  
❌ razorpay_payments  

---

## 🎯 Recommended Questions (That Work Well)

### Simple Queries:
- "Show me all students"
- "List all teachers"
- "How many classes are there?"
- "Show me subjects"

### Specific Queries:
- "Show me attendance for CLASS 1 on 2026-01-15"
- "Find student with USN 2024001"
- "Show me fee status for student 123"
- "What's the exam schedule for CLASS 10?"

### Avoid (For Now):
- Questions with "average", "total", "calculate"
- Questions with date ranges
- Questions requiring multiple conditions
- Questions about trends or comparisons

---

## 🚀 Future Enhancements

### Easy to Add:
1. **Marks/Grades queries** - Tables exist, just need intents
2. **Calendar events** - Simple SELECT queries
3. **Diary entries** - Text retrieval
4. **Parent information** - JOIN with students

### Medium Complexity:
1. **Attendance percentages** - Requires aggregation
2. **Fee summaries** - Requires SUM/GROUP BY
3. **Class rankings** - Requires ORDER BY with calculations
4. **Teacher workload** - Requires COUNT across tables

### Complex:
1. **Performance analytics** - Requires complex aggregations
2. **Trend analysis** - Requires time-series queries
3. **Predictive queries** - Requires ML integration
4. **Cross-system queries** - Requires multiple database connections

---

## 💡 Tips for Users

### For Best Results:
1. **Be specific** - "Show me attendance for CLASS 1 on 2026-01-15" vs "Show me attendance"
2. **Use exact names** - "CLASS 1" not "class one" or "first class"
3. **One question at a time** - Don't combine multiple queries
4. **Use supported intents** - Stick to the 8 current intent types

### If Query Fails:
1. Try simpler version of the question
2. Check if the data type is supported
3. Verify the table/column exists in database
4. Check if your role has permission

---

## 📝 Summary

**Current Capabilities:** 8 intent types covering basic CRUD operations  
**Current Limitations:** No aggregations, no date ranges, no complex analytics  
**Extensibility:** Easy to add new intents following the pattern  
**Security:** Read-only, role-based access, parameterized queries  

The MCP server is designed for **simple, direct database queries** rather than complex analytics. For advanced analytics, consider building dedicated API endpoints or reports.
