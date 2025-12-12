# Fix: Template Does Not Exist Error

## Error Message
```
"(#132001) Template name does not exist in the translation"
"template name (attendance_alert) does not exist in en_US"
```

## Root Cause
The `attendance_alert` template has **NOT been created and approved** in Meta's WhatsApp Business Manager. WhatsApp Cloud API requires all message templates to be pre-registered with Meta before use.

## Quick Fix: Test with Pre-Approved Template

Your test account comes with a pre-approved `hello_world` template. Use it to verify everything works:

### Option 1: Use the Web UI
1. Open http://localhost:4100
2. Click the link "Click here to test with hello_world template"
3. Click "Send Test WhatsApp"

### Option 2: Use API Directly
```bash
curl -X POST http://localhost:4100/api/v1/message-jobs \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "demo-school",
    "type": "transactional",
    "templateName": "hello_world",
    "language": "en_US",
    "payload": {},
    "recipients": [
      {
        "phone": "+918850623515"
      }
    ]
  }'
```

## Permanent Fix: Create Template in Meta

To use the `attendance_alert` template, you must create it in Meta Business Manager:

### Step 1: Access Meta Business Manager
1. Go to https://business.facebook.com/
2. Navigate to **WhatsApp Manager** → **Message templates**
3. Click **Create template**

### Step 2: Fill Template Details
- **Name**: `attendance_alert`
- **Category**: `UTILITY` (for alerts/notifications)
- **Language**: `English (US)`

### Step 3: Create Template Body
Enter this exact text with numbered placeholders:
```
Hello {{1}}, your child {{2}} was marked {{3}} on {{4}}.
```

**Parameter Mapping**:
- `{{1}}` = parent_name
- `{{2}}` = student_name  
- `{{3}}` = status (Present/Absent)
- `{{4}}` = date

### Step 4: Add Sample Content
Provide example values for Meta's review:
- `{{1}}`: Mrs. Verma
- `{{2}}`: Rahul
- `{{3}}`: Absent
- `{{4}}`: 2025-11-05

### Step 5: Submit & Wait
1. Click **Submit**
2. Wait for approval (15 minutes to 24 hours)
3. Check status in Message Templates section

### Step 6: Test After Approval
Once approved, test with:
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
  "recipients": [
    {
      "phone": "+918850623515"
    }
  ]
}
```

## Why This Happens

WhatsApp uses a two-part template system:

1. **Meta Template** (Required):
   - Registered in Meta Business Manager
   - Uses numbered placeholders: `{{1}}`, `{{2}}`
   - Must be approved before use
   - Cannot be changed without re-approval

2. **Local Template File** (Optional):
   - Your `.txt` file in `templates/whatsapp_templates/`
   - Uses Handlebars: `{{parent_name}}`, `{{student_name}}`
   - Maps JSON payload to numbered parameters
   - Can be changed anytime

**You have the local file, but not the Meta template!**

## Verification Checklist

Before testing `attendance_alert`:
- [ ] Template created in Meta Business Manager
- [ ] Template name is exactly `attendance_alert` (lowercase)
- [ ] Language is `en_US` (not just `en`)
- [ ] Template status is **APPROVED** (not PENDING/REJECTED)
- [ ] Local file exists: `templates/whatsapp_templates/attendance_alert.en_US.txt`
- [ ] Access token is valid in `.env`
- [ ] Phone number ID is correct in `.env`

## Additional Resources

- Full setup guide: See `TEMPLATE_SETUP_GUIDE.md`
- Troubleshooting: See `TROUBLESHOOTING.md`
- Meta docs: https://developers.facebook.com/docs/whatsapp/message-templates

## Common Questions

**Q: Can I skip Meta approval?**  
A: No. All WhatsApp templates must be pre-approved by Meta.

**Q: How long does approval take?**  
A: Usually 15 minutes to 24 hours. Check status in Meta Business Manager.

**Q: Can I test without approval?**  
A: Yes, use the pre-approved `hello_world` template for testing.

**Q: What if my template gets rejected?**  
A: Check the rejection reason in Meta Business Manager and revise accordingly.

**Q: Do I need to create templates for every language?**  
A: Yes, each language requires a separate template submission.
