# WhatsApp Plugin - Quick Start

## Current Status

✅ **Plugin is running correctly**  
✅ **Configuration is correct**  
✅ **Local templates exist**  
❌ **Meta templates NOT created/approved**

## The Issue

You're getting this error:
```
"Template name (attendance_alert) does not exist in en_US"
```

**Why?** The `attendance_alert` template hasn't been created in Meta's WhatsApp Business Manager yet.

## Quick Test (2 minutes)

Test that everything works using the pre-approved `hello_world` template:

### Method 1: Web UI
1. Open http://localhost:4100
2. Click "Click here to test with hello_world template"
3. Enter your phone number
4. Click "Send Test WhatsApp"
5. Check your WhatsApp for the message

### Method 2: Command Line
```bash
curl -X POST http://localhost:4100/api/v1/message-jobs \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "demo-school",
    "type": "transactional",
    "templateName": "hello_world",
    "language": "en_US",
    "payload": {},
    "recipients": [{"phone": "+918850623515"}]
  }'
```

If this works, your plugin is fine! You just need to create templates in Meta.

## Create Your First Template (15 minutes)

### 1. Go to Meta Business Manager
https://business.facebook.com/ → WhatsApp Manager → Message templates

### 2. Click "Create template"

### 3. Fill in the form:
- **Name**: `attendance_alert`
- **Category**: `UTILITY`
- **Language**: `English (US)`

### 4. Template body:
```
Hello {{1}}, your child {{2}} was marked {{3}} on {{4}}.
```

### 5. Sample values:
- {{1}}: Mrs. Verma
- {{2}}: Rahul
- {{3}}: Absent
- {{4}}: 2025-11-05

### 6. Submit and wait
- Approval usually takes 15 minutes to 24 hours
- Check status in Message Templates section

### 7. Test after approval:
```json
{
  "tenantId": "demo-school",
  "type": "transactional",
  "templateName": "attendance_alert",
  "language": "en_US",
  "payload": {
    "parent_name": "Mrs. Verma",
    "student_name": "Rahul",
    "status": "Absent",
    "date": "2025-11-05"
  },
  "recipients": [{"phone": "+918850623515"}]
}
```

## What's Already Done

✅ WhatsApp plugin installed and configured  
✅ Environment variables set correctly  
✅ Local template files created  
✅ API endpoints working  
✅ Test UI available at http://localhost:4100

## What You Need to Do

1. **Test with hello_world** (to verify everything works)
2. **Create templates in Meta** (for attendance_alert and other templates)
3. **Wait for approval** (15 min - 24 hours)
4. **Test your templates** (after approval)

## Need More Help?

- **Detailed setup**: See `TEMPLATE_SETUP_GUIDE.md`
- **Fix template error**: See `FIX_TEMPLATE_ERROR.md`
- **Troubleshooting**: See `TROUBLESHOOTING.md`

## Templates You'll Need

For a school ERP system, create these templates in Meta:

1. **attendance_alert** - Daily attendance notifications
2. **fee_reminder** - Fee payment reminders
3. **exam_schedule** - Exam date notifications
4. **leave_approval** - Leave request status
5. **announcement** - General school announcements

Each template needs to be created and approved separately in Meta Business Manager.

## Important Notes

- ⚠️ **All templates must be pre-approved by Meta**
- ⚠️ **Template names are case-sensitive**
- ⚠️ **Language codes must match exactly** (e.g., `en_US` not `en`)
- ⚠️ **Changes require re-approval**
- ✅ **hello_world is pre-approved for testing**
