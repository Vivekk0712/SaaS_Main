# Digital Diary WhatsApp Notifications

## Overview
Automatic WhatsApp notifications to parents when teachers publish assignments/homework in the Digital Diary.

## Problem Solved
- Parents weren't aware of new assignments
- Manual notification was time-consuming
- No automated communication system
- Missed homework deadlines

## Solution
- Automatic WhatsApp notifications
- One-click send after publishing
- Bulk messaging to all parents
- Professional template messages

## Features

### 1. WhatsApp Template
**Template Name:** `assignment_update`
**Category:** Utility
**Language:** English

**Message:**
```
New assignment has been published.

Subject: {{1}}
Class: {{2}}
Date: {{3}}

Please check the assignment details in the ERP.
```

**Variables:**
- `{{1}}` - Subject (e.g., "Physics")
- `{{2}}` - Class & Section (e.g., "CLASS 1 - A")
- `{{3}}` - Date (e.g., "22-12-2025")

### 2. Notification API
**Endpoint:** `/api/diary/notify`
**Method:** POST

**Request:**
```json
{
  "klass": "CLASS 1",
  "section": "A",
  "subject": "Physics",
  "date": "2025-12-22"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notifications sent successfully",
  "sent": 25,
  "skipped": 3,
  "failed": 0,
  "total": 28
}
```

### 3. Teacher UI Integration
**File:** `apps/frontend-next/src/app/teacher/diary/page.tsx`

**Flow:**
1. Teacher fills diary form
2. Clicks "Publish for selected date"
3. Green button appears: "📱 Send WhatsApp Notifications"
4. Teacher clicks notification button
5. System sends to all parents
6. Success message shows counts

## Implementation Details

### Database Query
```sql
SELECT 
  s.usn,
  s.name as student_name,
  p.phone as parent_phone,
  p.name as parent_name
FROM students s
LEFT JOIN parents p ON s.guardian_id = p.id
WHERE s.class_id = ? 
  AND s.section_id = ? 
  AND s.status = 'active'
```

### Notification Logic
```typescript
1. Get class_id from classes table
2. Get section_id from sections table
3. Fetch all active students in class/section
4. Get parent phone numbers via guardian_id
5. Skip students without parent phones
6. Send WhatsApp template to each parent
7. Return counts: sent, skipped, failed
```

### WhatsApp API Call
```typescript
POST http://localhost:3002/api/whatsapp/send-template
{
  "to": "+919876543210",
  "template": "assignment_update",
  "language": "en",
  "parameters": [
    "Physics",           // Subject
    "CLASS 1 - A",      // Class
    "22-12-2025"        // Date
  ]
}
```

## User Flow

### Teacher Side

1. **Create Assignment**
   - Go to `/teacher/diary`
   - Select date, class, section, subject
   - Add description and files
   - Click "Publish for selected date"

2. **Send Notifications**
   - See green button: "📱 Send WhatsApp Notifications"
   - Click button
   - Button shows "⏳ Sending..."
   - Wait for completion

3. **View Results**
   - Success message appears
   - Shows: Sent, Skipped, Failed counts
   - Button disappears after sending

### Parent Side

1. **Receive WhatsApp**
   - Get message on WhatsApp
   - See subject, class, date
   - Click link to view details

2. **View Assignment**
   - Login to ERP
   - Go to student diary
   - See assignment details
   - Download attachments

## Example Messages

### Physics Assignment
```
New assignment has been published.

Subject: Physics
Class: CLASS 1 - A
Date: 22-12-2025

Please check the assignment details in the ERP.
```

### Mathematics Homework
```
New assignment has been published.

Subject: Mathematics
Class: CLASS 10 - B
Date: 23-12-2025

Please check the assignment details in the ERP.
```

## Benefits

### For Teachers
✅ One-click notification
✅ Bulk send to all parents
✅ No manual messaging
✅ Instant delivery
✅ Delivery confirmation

### For Parents
✅ Instant notification
✅ Professional message
✅ Clear information
✅ Direct link to ERP
✅ No missed assignments

### For School
✅ Better communication
✅ Improved engagement
✅ Reduced complaints
✅ Professional image
✅ Automated workflow

## Configuration

### Environment Variables
```env
# WhatsApp Plugin
WHATSAPP_PLUGIN_URL=http://localhost:3002

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=school_management
```

### WhatsApp Template Setup

1. **Login to Meta Business**
   - Go to business.facebook.com
   - Select your WhatsApp Business Account

2. **Create Template**
   - Go to Message Templates
   - Click "Create Template"
   - Name: `assignment_update`
   - Category: Utility
   - Language: English

3. **Template Content**
   ```
   New assignment has been published.

   Subject: {{1}}
   Class: {{2}}
   Date: {{3}}

   Please check the assignment details in the ERP.
   ```

4. **Submit for Approval**
   - Review template
   - Submit to Meta
   - Wait for approval (usually 24-48 hours)

5. **Test Template**
   - Once approved, test with sample data
   - Verify message format
   - Check variable substitution

## Error Handling

### No Parent Phone Numbers
```
Sent: 0
Skipped: 28
Failed: 0
```
**Solution:** Add parent phone numbers in database

### WhatsApp Plugin Down
```
Error: Failed to send notifications
```
**Solution:** Start WhatsApp plugin on port 3002

### Template Not Approved
```
Error: Template not found
```
**Solution:** Wait for Meta approval or check template name

### Invalid Phone Numbers
```
Sent: 20
Skipped: 3
Failed: 5
```
**Solution:** Verify phone number format (+91XXXXXXXXXX)

## Monitoring

### Success Metrics
- Total notifications sent
- Delivery rate
- Failed count
- Skipped count

### Logs
```
Fetching students for assignment notification: CLASS 1 A - Physics
Found 28 students
Sending notifications to 25 parents
✓ Sent to +919876543210 (Parent Name)
✓ Sent to +919876543211 (Parent Name)
...
```

### Database Tracking
Store notification history:
```sql
CREATE TABLE notification_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type VARCHAR(50),
  class_id INT,
  section_id INT,
  subject VARCHAR(100),
  date DATE,
  sent_count INT,
  failed_count INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Best Practices

### 1. Timing
- Send during school hours (9 AM - 5 PM)
- Avoid late night notifications
- Consider parent time zones

### 2. Frequency
- Don't spam parents
- One notification per assignment
- Batch multiple updates if possible

### 3. Content
- Keep message professional
- Include essential info only
- Provide clear call-to-action

### 4. Testing
- Test with small group first
- Verify template variables
- Check phone number format
- Monitor delivery rates

## Limitations

### 1. WhatsApp Business API Required
⚠️ Need approved WhatsApp Business Account
⚠️ Template must be approved by Meta
⚠️ Cannot send custom messages

### 2. Parent Phone Numbers Required
⚠️ Students must have guardian_id
⚠️ Parents must have phone numbers
⚠️ Phone numbers must be valid

### 3. Rate Limits
⚠️ WhatsApp has sending limits
⚠️ May need queuing for large schools
⚠️ Consider batch processing

## Future Enhancements

1. ⚠️ Add notification preferences per parent
2. ⚠️ Add opt-out functionality
3. ⚠️ Add delivery status tracking
4. ⚠️ Add read receipts
5. ⚠️ Add reminder notifications
6. ⚠️ Add multi-language support
7. ⚠️ Add SMS fallback
8. ⚠️ Add email notifications

## Testing

### Manual Test
```powershell
.\test-diary-notifications.ps1
```

### API Test
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/diary/notify" `
    -Method POST `
    -ContentType "application/json" `
    -Body (@{
        klass = "CLASS 1"
        section = "A"
        subject = "Physics"
        date = "2025-12-22"
    } | ConvertTo-Json)

$response | ConvertTo-Json
```

### Database Test
```sql
-- Check students with parent phones
SELECT 
  COUNT(*) as total_students,
  COUNT(p.phone) as with_phone,
  COUNT(*) - COUNT(p.phone) as without_phone
FROM students s
LEFT JOIN parents p ON s.guardian_id = p.id
WHERE s.class_id = 1 AND s.section_id = 1;
```

## Related Files

- `/app/teacher/diary/page.tsx` - Teacher UI
- `/app/api/diary/notify/route.ts` - Notification API
- `/whatsapp_plugin/templates/assignment_update.en.txt` - Template
- `test-diary-notifications.ps1` - Test script

## Summary

✅ **Automatic notifications** when assignments published
✅ **One-click send** to all parents
✅ **Professional templates** approved by Meta
✅ **Bulk messaging** with delivery tracking
✅ **Error handling** with skip/fail counts
✅ **Easy integration** with existing diary system

The Digital Diary now has complete WhatsApp notification support! 🎉
