# MCP Database Chat - Working Queries Guide

## ✅ Confirmed Working

### 1. Attendance
**Question:** "Who is absent today?"  
**Intent:** `get_attendance` ✅  
**Result:** Returns absent students successfully

### 2. Student Info
**Question:** "Show me all students"  
**Intent:** `get_student_info` ✅  
**Result:** Returns student list

## 🔧 Queries to Try

### Basic Queries (Should Work):
```
"Show me all students"
"List all teachers"
"How many students are in CLASS 1?"
"Show me all classes"
"Who is absent today?"
```

### New Features (Test These):

#### Marks:
```
"Show me all marks"
"Show me marks for CLASS 1"
"What are the test results?"
```

#### Parent Info:
```
"Show me all parents"
"List parent contacts"
"Show me parent information"
```

#### Calendar:
```
"Show me all calendar events"
"What events are scheduled?"
"List all events"
```

#### Diary:
```
"Show me diary entries"
"What's in the diary?"
"Show me all diary notes"
```

#### Analytics:
```
"Show me attendance for CLASS 1 this month"
"Calculate attendance for CLASS 1"
"Show me class performance"
```

## 💡 Tips for Success

### Use Generic Queries First:
Instead of: "Show me marks for student USN 1A01"  
Try: "Show me all marks"

Instead of: "Parent contact for Aditya Kumar"  
Try: "Show me all parents"

### Why?
The system works best with:
1. **List all** queries - "Show me all X"
2. **Class-based** queries - "Show me X for CLASS 1"
3. **Date-based** queries - "Show me X for today"

### Specific student queries need exact matches:
- USN must match exactly (case-sensitive)
- Names must match database format
- IDs must be correct

## 🎯 Recommended Test Sequence

1. **Start Simple:**
   - "Show me all students"
   - "List all teachers"
   - "Show me all classes"

2. **Try New Features:**
   - "Show me all marks"
   - "Show me all parents"
   - "Show me calendar events"

3. **Try Analytics:**
   - "Show me class performance for CLASS 1"
   - "Calculate attendance for CLASS 1"

4. **Try Specific Queries:**
   - "Show me marks for CLASS 1"
   - "Show me parents for CLASS 1"

## 📊 Database Status

✅ **Data Available:**
- 9,000 mark entries
- 600 parents
- Students with USN like '1A01'
- Attendance records
- Classes and sections

The data is there - we just need to query it correctly!

## 🔍 Debugging

If a query doesn't work:
1. Check the intent shown (🎯 icon)
2. Try a simpler version
3. Use "Show me all X" format
4. Check if data exists for that specific filter

## Next Steps

Try these working queries:
1. "Show me all marks"
2. "Show me all parents"
3. "Show me calendar events"
4. "Show me class performance for CLASS 1"
