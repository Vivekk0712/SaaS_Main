# MCP Server - Role-Based Permissions Matrix

## Overview

Yes! **Admin and Principal have full access** to all queries, while other roles have restricted access based on their responsibilities.

## Complete Permissions Matrix

| Query Type | Student | Teacher | HOD | Principal | Accountant | Admin |
|------------|---------|---------|-----|-----------|------------|-------|
| **Timetable** | ✅ Own class | ✅ All classes | ✅ All classes | ✅ All | ❌ | ✅ All |
| **Attendance** | ❌ | ✅ Their classes | ✅ Department | ✅ All | ❌ | ✅ All |
| **Student Info** | ❌ | ✅ Their students | ✅ Department | ✅ All | ✅ All | ✅ All |
| **Teacher Info** | ❌ | ❌ | ✅ Department | ✅ All | ❌ | ✅ All |
| **Fee Status** | ✅ Own only | ❌ | ❌ | ✅ All | ✅ All | ✅ All |
| **Exam Schedule** | ✅ Own class | ✅ All classes | ✅ All classes | ✅ All | ❌ | ✅ All |
| **Class Info** | ❌ | ✅ Their classes | ✅ Department | ✅ All | ✅ All | ✅ All |
| **Subject Info** | ❌ | ✅ All subjects | ✅ All subjects | ✅ All | ❌ | ✅ All |

## Detailed Role Permissions

### 👨‍🎓 Student (Most Restricted)
**Can Access:**
- ✅ Own class timetable
- ✅ Own exam schedule
- ✅ Own fee status

**Cannot Access:**
- ❌ Other students' information
- ❌ Teacher information
- ❌ Attendance records
- ❌ Class information
- ❌ Subject details

**Example Questions:**
- "Show me my timetable"
- "When is my next exam?"
- "What's my fee status?"

---

### 👨‍🏫 Teacher
**Can Access:**
- ✅ All timetables
- ✅ Attendance for their classes
- ✅ Student information (their students)
- ✅ Exam schedules
- ✅ Class information (their classes)
- ✅ Subject information

**Cannot Access:**
- ❌ Teacher information (other teachers)
- ❌ Fee status
- ❌ Students from other classes

**Example Questions:**
- "Show attendance for Class 10A today"
- "Get details of student John in my class"
- "What's the timetable for tomorrow?"
- "Who teaches Mathematics?"

---

### 👔 HOD (Head of Department)
**Can Access:**
- ✅ All timetables
- ✅ Attendance (department-wide)
- ✅ Student information (department)
- ✅ Teacher information (department)
- ✅ Exam schedules
- ✅ Class information (department)
- ✅ Subject information

**Cannot Access:**
- ❌ Fee status

**Example Questions:**
- "Show all teachers in Mathematics department"
- "Get attendance for all classes in my department"
- "List all students in Science department"
- "What's the designation of teachers in my department?"

---

### 🎓 Principal (Full Access)
**Can Access:**
- ✅ **EVERYTHING** - All 8 query types
- ✅ School-wide data
- ✅ All students, teachers, classes
- ✅ All financial information
- ✅ All attendance records

**Example Questions:**
- "Show me all students with pending fees"
- "Get attendance report for the entire school"
- "List all teachers and their designations"
- "How many students are in each class?"
- "Show me all exam schedules"

---

### 💰 Accountant
**Can Access:**
- ✅ Student information (for billing)
- ✅ Fee status (all students)
- ✅ Class information

**Cannot Access:**
- ❌ Attendance records
- ❌ Teacher information
- ❌ Timetables
- ❌ Exam schedules
- ❌ Subject information

**Example Questions:**
- "How many students have pending fees?"
- "Show fee status for Class 10A"
- "Get contact details of students with overdue fees"
- "List all students in Class 9B"

---

### 🔧 Admin (Full Access)
**Can Access:**
- ✅ **EVERYTHING** - All 8 query types
- ✅ Same as Principal
- ✅ Full system access

**Example Questions:**
- Any question that Principal can ask
- Full database access (read-only)

---

## How Permissions Are Enforced

### 1. At Query Time
```python
# In query_planner.py
def check_permission(user_roles, intent):
    # Check if ANY of user's roles allow this intent
    for role in user_roles:
        if intent in ROLE_PERMISSIONS[role]:
            return True
    return False  # Permission denied
```

### 2. Multiple Roles
Users can have multiple roles:
```javascript
// User with multiple roles gets combined permissions
{
  "sub": "user123",
  "roles": ["teacher", "hod"]  // Can access both teacher AND hod queries
}
```

### 3. Permission Denied Response
```json
{
  "error": "You don't have permission to access this information",
  "status": 403
}
```

## Security Features

### ✅ What's Protected

1. **Role-Based Access Control (RBAC)**
   - Every query checks user roles
   - Automatic permission enforcement
   - No way to bypass

2. **Read-Only Access**
   - Cannot INSERT, UPDATE, DELETE
   - Cannot DROP tables
   - Cannot modify any data

3. **Audit Logging**
   - Every query logged with user_id
   - Tracks who accessed what
   - Compliance-ready

4. **SQL Injection Prevention**
   - Parameterized queries only
   - No raw SQL execution
   - Predefined templates

### ❌ What's NOT Possible

- ❌ Students cannot see other students' data
- ❌ Teachers cannot see salary information
- ❌ Teachers cannot access other teachers' personal info
- ❌ No one can modify database (read-only)
- ❌ No one can execute arbitrary SQL
- ❌ No one can bypass role checks

## Customizing Permissions

### Add New Role
```python
# In query_planner.py
UserRole.LIBRARIAN: [
    Intent.GET_STUDENT_INFO,
    Intent.GET_CLASS_INFO,
    # Add book-related intents
]
```

### Modify Existing Role
```python
# Give teachers access to fee status
UserRole.TEACHER: [
    Intent.GET_TIMETABLE,
    Intent.GET_ATTENDANCE,
    Intent.GET_STUDENT_INFO,
    Intent.GET_FEE_STATUS,  # Add this
    Intent.GET_EXAM_SCHEDULE,
    Intent.GET_CLASS_INFO,
    Intent.GET_SUBJECT_INFO,
]
```

### Remove Permission
```python
# Remove teacher access to student info
UserRole.TEACHER: [
    Intent.GET_TIMETABLE,
    Intent.GET_ATTENDANCE,
    # Intent.GET_STUDENT_INFO,  # Commented out
    Intent.GET_EXAM_SCHEDULE,
    Intent.GET_CLASS_INFO,
    Intent.GET_SUBJECT_INFO,
]
```

## Testing Permissions

### Test as Different Roles

```python
# Generate tokens for different roles
python quick-token.py

# Test as student
roles = ["student"]

# Test as teacher
roles = ["teacher"]

# Test as admin
roles = ["admin"]
```

### Verify Permission Denied

```bash
# Try accessing restricted data
curl -X POST http://localhost:5003/api/v1/query \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -d '{"question": "Show me all teachers"}'

# Should return 403 Forbidden
```

## Best Practices

### 1. Principle of Least Privilege
- Give users minimum permissions needed
- Students: Own data only
- Teachers: Their classes only
- Admins: Everything

### 2. Multiple Roles for Flexibility
```javascript
// Teacher who is also HOD
{
  "roles": ["teacher", "hod"]
}

// Principal who is also admin
{
  "roles": ["principal", "admin"]
}
```

### 3. Audit Everything
- Log all queries
- Track permission denials
- Review access patterns

### 4. Regular Review
- Review role permissions quarterly
- Remove unnecessary access
- Update based on feedback

## Summary

**Yes, Admin and Principal have full control!**

| Role | Access Level | Use Case |
|------|-------------|----------|
| **Admin** | 🔓 Full Access | System administration |
| **Principal** | 🔓 Full Access | School management |
| **HOD** | 🔒 Department Only | Department management |
| **Teacher** | 🔒 Classes Only | Teaching duties |
| **Accountant** | 🔒 Financial Only | Fee management |
| **Student** | 🔒 Own Data Only | Personal information |

The system is designed to be **secure by default** with **granular role-based access control**. You can customize permissions based on your school's needs!
