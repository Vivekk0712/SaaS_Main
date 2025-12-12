# Template Configuration Update

## Current Template Setup

Your `attendance_alert` template has been created in Meta Business Manager with the following configuration:

### Meta Template (Facebook Console)
```
Attendance alert: {{1}} was marked {{2}} on {{3}} as per school records.
```

### Language Code
- **Set in Meta**: `en` (English)
- **Not**: `en_US` (English US)

### Parameter Mapping
- `{{1}}` → `student_name` (e.g., "Rahul")
- `{{2}}` → `status` (e.g., "Absent", "Present")
- `{{3}}` → `date` (e.g., "2025-11-04")

## Local Template File

**File**: `templates/whatsapp_templates/attendance_alert.en.txt`

```
Attendance alert: {{student_name}} was marked {{status}} on {{date}} as per school records.
```

**Note**: The local file uses Handlebars syntax (`{{student_name}}`) which gets mapped to Meta's numbered placeholders (`{{1}}`).

## How to Use

### 1. Via Web UI

1. Open http://localhost:4100
2. Select template: `attendance_alert`
3. Select language: `English (en)`
4. The payload is pre-filled:
```json
{
  "student_name": "Rahul",
  "status": "Absent",
  "date": "2025-11-04"
}
```
5. Enter recipient phone number
6. Click "Send Test WhatsApp"

### 2. Via API

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
      "date": "2025-11-04"
    },
    "recipients": [
      {
        "phone": "+918850623515",
        "name": "Parent Name"
      }
    ]
  }'
```

## Important Notes

### Language Code Mismatch

You set the template language as `en` (English) instead of `en_US` (English US) in Meta. This is fine, but you must use `en` in your API calls:

✅ **Correct**: `"language": "en"`  
❌ **Wrong**: `"language": "en_US"`

### Template Content is Fixed

The message content is defined in Meta Business Manager and cannot be changed from your application. You can only:
- Select which template to use
- Provide values for the placeholders
- Choose recipients

To change the message content, you must:
1. Edit the template in Meta Business Manager
2. Wait for re-approval
3. Update your local `.txt` file to match

### Parameter Order Matters

The order of parameters in your payload doesn't matter, but the mapping does:

```json
{
  "student_name": "Rahul",    // Maps to {{1}}
  "status": "Absent",          // Maps to {{2}}
  "date": "2025-11-04"        // Maps to {{3}}
}
```

The local template file (`attendance_alert.en.txt`) defines this mapping.

## Testing

### Test Payload Examples

**Absent Student**:
```json
{
  "student_name": "Rahul Sharma",
  "status": "Absent",
  "date": "2025-11-17"
}
```

**Present Student**:
```json
{
  "student_name": "Priya Patel",
  "status": "Present",
  "date": "2025-11-17"
}
```

**Late Student**:
```json
{
  "student_name": "Amit Kumar",
  "status": "Late",
  "date": "2025-11-17"
}
```

### Expected WhatsApp Message

When you send the test payload, the recipient will receive:

```
Attendance alert: Rahul Sharma was marked Absent on 2025-11-17 as per school records.
```

## Troubleshooting

### Error: "Template name does not exist"

**Cause**: Template not approved or wrong language code

**Solution**:
1. Check template status in Meta Business Manager
2. Ensure you're using `"language": "en"` (not `en_US`)
3. Wait for approval if status is PENDING

### Error: "Parameter count mismatch"

**Cause**: Missing or extra fields in payload

**Solution**: Ensure payload has exactly these fields:
- `student_name`
- `status`
- `date`

### Error: "Invalid language code"

**Cause**: Using wrong language code

**Solution**: Use `"language": "en"` to match your Meta template

## Creating Additional Templates

If you want to create more templates with different languages:

### English US Version
1. Create new template in Meta with language `en_US`
2. Create file: `attendance_alert.en_US.txt`
3. Use `"language": "en_US"` in API calls

### Hindi Version
1. Create new template in Meta with language `hi`
2. Create file: `attendance_alert.hi.txt` with Hindi text
3. Use `"language": "hi"` in API calls

## File Naming Convention

Template files must follow this pattern:
```
{template_name}.{language_code}.txt
```

Examples:
- `attendance_alert.en.txt` → English
- `attendance_alert.en_US.txt` → English US
- `attendance_alert.hi.txt` → Hindi
- `hello_world.en_US.txt` → English US

## Summary

✅ **What's Done**:
- Template created in Meta: `attendance_alert`
- Language set to: `en` (English)
- Local file created: `attendance_alert.en.txt`
- UI updated to use correct language code
- Payload simplified (removed `parent_name`)

✅ **What You Need to Do**:
1. Ensure template is approved in Meta
2. Use `"language": "en"` in all API calls
3. Test with the provided payload
4. Monitor message delivery

✅ **What Changed**:
- Removed `parent_name` from payload (not in Meta template)
- Changed language from `en_US` to `en`
- Updated UI to show template info
- Simplified payload structure
