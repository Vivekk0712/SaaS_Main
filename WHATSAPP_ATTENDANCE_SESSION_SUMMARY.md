# 📱 WhatsApp Attendance Notification - Session Summary

## 🎯 Goal
Integrate WhatsApp notifications for attendance alerts. When a teacher marks attendance, they can send notifications to parents of absent students.

---

## 📊 Current Attendance System Analysis

### **How Attendance Works:**

#### **1. Teacher Attendance Page**
- **Location:** `apps/frontend-next/src/app/teacher/attendance/page.tsx`
- **Data Storage:** `apps/frontend-next/src/app/teacher/data.ts`

#### **2. Attendance Flow:**
1. Teacher selects:
   - Class (e.g., "Class 10")
   - Section (e.g., "A")
   - Date (YYYY-MM-DD)
   - Hour (1-5)
   - Subject (e.g., "Mathematics")
   - Optional: Topic

2. Marks each student as:
   - **P** = Present (green)
   - **A** = Absent (red)
   - **L** = Leave (orange)

3. Clicks **"Save Attendance"** button

#### **3. Storage Mechanism:**
```typescript
// Key format: date|class|section|hour
// Example: "2025-11-30|Class 10|A|1"

saveAttendance(date, klass, section, hour, map, subject)
// Stores in localStorage: 'school:attendance'
// Format: { "2025-11-30|Class 10|A|1": { map: { "101": "P", "102": "A", ... }, subject: "Math" } }
```

#### **4. Update Behavior:**
✅ **YES - Attendance can be updated!**
- Same key (date|class|section|hour) overwrites previous data
- If teacher marks student absent by mistake, they can change to present and re-save
- The `saveAttendance()` function replaces the entire attendance map for that slot

---

## 📱 WhatsApp Plugin Structure

### **Plugin Location:** `whatsapp_plugin/`

#### **Key Components:**
1. **Service:** `src/services/whatsappService.ts`
   - Handles message sending
   - Supports template messages (transactional)
   - Batch processing for bulk messages

2. **Template:** `templates/whatsapp_templates/attendance_alert.en.txt`
   ```
   Attendance alert: {{student_name}} was marked {{status}} on {{date}} as per school records.
   ```

3. **Configuration:** `.env`
   - WhatsApp Cloud API credentials
   - Phone Number ID
   - Access Token
   - Template settings

4. **API Endpoint:** Port 4100
   - `/api/v1/message-jobs` - Send messages
   - `/health` - Health check

---

## 🔧 Implementation Plan

### **Step 1: Add "Send Notifications" Button**
- Location: `apps/frontend-next/src/app/teacher/attendance/page.tsx`
- Add button next to "Save Attendance"
- Only enabled after attendance is saved
- Shows count of absent students

### **Step 2: Create API Route**
- **New file:** `apps/frontend-next/src/app/api/attendance/notify/route.ts`
- Receives: date, class, section, hour
- Fetches: attendance data + student/parent info
- Filters: only absent students
- Calls: WhatsApp plugin API

### **Step 3: Get Parent Phone Numbers**
- **Need to check:** Database schema for parent phone field
- **Likely tables:**
  - `students` table → `parent_phone` or `guardian_phone`
  - `parents` table → linked to students
  - `profiles` table → contact information

### **Step 4: WhatsApp Integration**
```typescript
// Call WhatsApp plugin
POST http://localhost:4100/api/v1/message-jobs
{
  "type": "bulk",
  "templateName": "attendance_alert",
  "language": "en",
  "recipients": [
    {
      "phone": "919876543210",
      "substitutions": {
        "student_name": "Rahul",
        "status": "Absent",
        "date": "10 November 2025"
      }
    }
  ]
}
```

### **Step 5: UI Feedback**
- Show loading state while sending
- Display success message: "Notifications sent to 5 parents"
- Handle errors gracefully
- Optional: Show delivery status

---

## 📋 Required Information

### **Before Implementation, Need to Verify:**

1. **Database Schema:**
   - [ ] Where are parent phone numbers stored?
   - [ ] Table name and column name
   - [ ] Is it linked to student USN/ID?

2. **WhatsApp Plugin:**
   - [ ] Is it already configured with Meta credentials?
   - [ ] Is the `attendance_alert` template approved in Meta Business Manager?
   - [ ] What's the template name in Meta? (must match exactly)

3. **Template Parameters:**
   - Current template uses: `{{student_name}}`, `{{status}}`, `{{date}}`
   - Meta template uses: `{{1}}`, `{{2}}`, `{{3}}`
   - Need to confirm parameter mapping

---

## 🎨 UI Design

### **Attendance Page Updates:**

```
┌─────────────────────────────────────────┐
│ Mark Attendance                         │
├─────────────────────────────────────────┤
│ [Class 10] [Section A] [2025-11-30]    │
│ [Hour 1] [Mathematics]                  │
│                                         │
│ Students:                               │
│ ☑ 101 - Student 101  [P] [A] [L]      │
│ ☑ 102 - Student 102  [P] [A] [L]      │
│ ☑ 103 - Student 103  [P] [A] [L]      │
│                                         │
│ [Save Attendance]                       │
│                                         │
│ ✅ Attendance saved for Class 10 A     │
│                                         │
│ 📱 Send WhatsApp Notifications          │
│ [Send to Absent Students (2)]          │
└─────────────────────────────────────────┘
```

---

## 🔄 Workflow

### **Teacher Workflow:**
1. Mark attendance (P/A/L for each student)
2. Click "Save Attendance"
3. Review absent students count
4. Click "Send to Absent Students (X)"
5. Confirm notification sending
6. See success message

### **Parent Receives:**
```
Attendance alert: Rahul was marked Absent on 10 November 2025 as per school records.
```

---

## 🚀 Next Steps (For New Session)

1. **Check Database Schema:**
   - Find parent phone number field
   - Verify student-parent relationship

2. **Verify WhatsApp Setup:**
   - Check `.env` configuration
   - Confirm template approval in Meta
   - Test with sample message

3. **Implement API Route:**
   - Create `/api/attendance/notify/route.ts`
   - Fetch attendance data
   - Get parent phone numbers
   - Call WhatsApp plugin

4. **Update Teacher UI:**
   - Add "Send Notifications" button
   - Show absent count
   - Display success/error messages

5. **Test End-to-End:**
   - Mark attendance
   - Send notifications
   - Verify WhatsApp delivery

---

## 📝 Key Files to Modify

### **New Files:**
- `apps/frontend-next/src/app/api/attendance/notify/route.ts` - API endpoint

### **Modified Files:**
- `apps/frontend-next/src/app/teacher/attendance/page.tsx` - Add notification button
- `apps/frontend-next/src/app/teacher/data.ts` - Add helper to get absent students

### **Reference Files:**
- `whatsapp_plugin/src/services/whatsappService.ts` - WhatsApp API
- `whatsapp_plugin/templates/whatsapp_templates/attendance_alert.en.txt` - Template
- `sql/schema.sql` - Database structure

---

## ⚠️ Important Notes

1. **Attendance Updates:** System supports updating attendance for same date/hour/class
2. **Only Absent Students:** Send notifications only for students marked "A" (not "L" or "P")
3. **Consent:** WhatsApp plugin has consent management - ensure parents have opted in
4. **Rate Limits:** Meta has rate limits - batch processing already handled by plugin
5. **Template Approval:** Template must be approved in Meta Business Manager before use

---

## 🎯 Success Criteria

- [ ] Teacher can send WhatsApp notifications after marking attendance
- [ ] Only parents of absent students receive notifications
- [ ] Notifications include student name, status, and date
- [ ] UI shows clear feedback (loading, success, errors)
- [ ] System handles errors gracefully
- [ ] Notifications can be sent multiple times if attendance is updated

---

**Ready to implement in next session!** 🚀
