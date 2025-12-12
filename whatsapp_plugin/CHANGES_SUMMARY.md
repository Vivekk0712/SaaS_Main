# Changes Summary - Template Update

## What Changed

### 1. Template Configuration ✅

**Meta Template (Facebook Console)**:
```
Attendance alert: {{1}} was marked {{2}} on {{3}} as per school records.
```

**Language**: `en` (English) - **Not** `en_US`

**Parameters**:
- {{1}} = student_name
- {{2}} = status  
- {{3}} = date

### 2. Local Template File ✅

**File**: `templates/whatsapp_templates/attendance_alert.en.txt`

**Content**:
```
Attendance alert: {{student_name}} was marked {{status}} on {{date}} as per school records.
```

**Note**: Removed `parent_name` as it's not in the Meta template.

### 3. UI Updates ✅

**Changes**:
- Changed warning banner to info banner
- Updated language selector to dropdown with `en` as default
- Added template information display showing Meta template format
- Updated default payload to match new template (removed `parent_name`)
- Added dynamic template info that updates when template changes

**New Features**:
- Template preview shows the actual Meta template message
- Required fields are displayed for each template
- Language dropdown prevents typos

### 4. Documentation Updates ✅

**New Files**:
- `TEMPLATE_UPDATE.md` - Complete guide for the updated template
- `CHANGES_SUMMARY.md` - This file
- `test-attendance-alert.sh` - Bash test script
- `test-attendance-alert.ps1` - PowerShell test script

**Updated Files**:
- `README.md` - Updated status and examples
- `attendance_alert.en.txt` - Updated template content

## How to Test

### Option 1: Web UI (Easiest)

1. Open http://localhost:4100
2. Template is pre-selected: `attendance_alert`
3. Language is pre-selected: `English (en)`
4. Payload is pre-filled:
   ```json
   {
     "student_name": "Rahul",
     "status": "Absent",
     "date": "2025-11-04"
   }
   ```
5. Enter your phone number: `+918850623515`
6. Click "Send Test WhatsApp"

### Option 2: PowerShell Script

```powershell
cd whatsapp_plugin
.\test-attendance-alert.ps1
```

### Option 3: Bash Script

```bash
cd whatsapp_plugin
bash test-attendance-alert.sh
```

### Option 4: Direct API Call

```bash
curl -X POST http://localhost:4100/api/v1/message-jobs \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "demo-school",
    "type": "transactional",
    "templateName": "attendance_alert",
    "language": "en",
    "payload": {
      "student_name": "Rahul",
      "status": "Absent",
      "date": "2025-11-17"
    },
    "recipients": [
      {
        "phone": "+918850623515"
      }
    ]
  }'
```

## Expected Result

### WhatsApp Message
```
Attendance alert: Rahul was marked Absent on 2025-11-17 as per school records.
```

### API Response (Success)
```json
{
  "jobId": "uuid-here",
  "status": "queued",
  "message": "Job queued successfully"
}
```

### API Response (If Not Approved Yet)
```json
{
  "error": "Template name does not exist in the translation",
  "details": "template name (attendance_alert) does not exist in en"
}
```

## Important Notes

### ⚠️ Language Code

**Must use**: `"language": "en"`  
**Not**: `"language": "en_US"`

This is because you set the template language as "English" (en) in Meta, not "English US" (en_US).

### ⚠️ Template Approval

The template must be **APPROVED** in Meta Business Manager before it will work. Check status:

1. Go to https://business.facebook.com/
2. Navigate to WhatsApp Manager → Message templates
3. Find `attendance_alert`
4. Status should be **APPROVED** (not PENDING or REJECTED)

### ⚠️ Payload Structure

**Correct** (3 fields):
```json
{
  "student_name": "Rahul",
  "status": "Absent",
  "date": "2025-11-17"
}
```

**Wrong** (includes parent_name):
```json
{
  "parent_name": "Mrs. Verma",  // ❌ Not in Meta template
  "student_name": "Rahul",
  "status": "Absent",
  "date": "2025-11-17"
}
```

## Troubleshooting

### Error: "Template name does not exist"

**Possible Causes**:
1. Template not approved yet in Meta
2. Wrong language code (using `en_US` instead of `en`)
3. Template name typo

**Solution**:
1. Check template status in Meta Business Manager
2. Ensure using `"language": "en"`
3. Wait for approval if status is PENDING

### Error: "Parameter count mismatch"

**Cause**: Wrong number of fields in payload

**Solution**: Use exactly 3 fields: `student_name`, `status`, `date`

### Message not received

**Possible Causes**:
1. Phone number not in E.164 format
2. Phone number not registered with WhatsApp
3. Template not approved
4. Access token expired

**Solution**:
1. Use format: `+[country_code][number]` (e.g., `+918850623515`)
2. Verify number has WhatsApp installed
3. Check template approval status
4. Regenerate access token if needed

## Next Steps

1. ✅ **Test with hello_world** (to verify plugin works)
2. ⏳ **Wait for attendance_alert approval** (check Meta Business Manager)
3. ✅ **Test attendance_alert** (once approved)
4. 📝 **Create more templates** (fee_reminder, exam_schedule, etc.)

## Files Modified

```
whatsapp_plugin/
├── templates/whatsapp_templates/
│   └── attendance_alert.en.txt          # Updated content
├── public/
│   ├── index.html                       # Updated UI
│   ├── styles.css                       # Added alert-info style
│   └── script.js                        # Added template info function
├── README.md                            # Updated examples
├── TEMPLATE_UPDATE.md                   # New guide
├── CHANGES_SUMMARY.md                   # This file
├── test-attendance-alert.sh             # New test script
└── test-attendance-alert.ps1            # New test script
```

## Quick Reference

| Item | Value |
|------|-------|
| Template Name | `attendance_alert` |
| Language Code | `en` |
| Parameters | `student_name`, `status`, `date` |
| Meta Message | "Attendance alert: {{1}} was marked {{2}} on {{3}} as per school records." |
| Local File | `attendance_alert.en.txt` |
| Test URL | http://localhost:4100 |

## Questions?

- See `TEMPLATE_UPDATE.md` for detailed information
- See `README.md` for general usage
- See `TROUBLESHOOTING.md` for common issues
