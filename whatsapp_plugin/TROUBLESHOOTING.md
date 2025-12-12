# WhatsApp Plugin Troubleshooting

## Current Issue: Template Not Approved in Meta

### Error
```
"(#132001) Template name does not exist in the translation"
"template name (attendance_alert) does not exist in en_US"
```

### Cause
The `attendance_alert` template hasn't been created and approved in Meta's WhatsApp Business Manager.

### Solution
1. **Quick test**: Use the pre-approved `hello_world` template to verify everything works
2. **Permanent fix**: Create and get approval for `attendance_alert` in Meta Business Manager

See `FIX_TEMPLATE_ERROR.md` for detailed instructions.

### Quick Test Command
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

## Fixed Issues

### ENOENT Error - Template Not Found

**Problem**: Getting error `ENOENT: no such file or directory, open 'C:\Users\Dell\ERP_System\templates\whatsapp_templates\attendance_alert.en_US.txt'`

**Root Cause**: The `TEMPLATE_DIR` in `.env` was pointing to the wrong path. It was set to an absolute path at the root level instead of the plugin's local templates folder.

**Fix**: Updated `.env` file:
```
# Before
TEMPLATE_DIR=C:\Users\Dell\ERP_System\templates\whatsapp_templates

# After
TEMPLATE_DIR=./templates/whatsapp_templates
```

### Template Format Differences (Not an Issue)

**Question**: Gmail plugin uses JSON templates while WhatsApp uses TXT templates - is this a problem?

**Answer**: No, this is intentional and correct:
- **Gmail/SES templates** (`.json`): Need subject, htmlBody, and textBody fields for email formatting
- **WhatsApp templates** (`.txt`): Only need plain text body since WhatsApp doesn't support HTML

Both use Handlebars syntax (`{{variable}}`) for variable substitution, which is consistent.

## How It Works

1. Frontend sends JSON payload with recipients and template data
2. WhatsApp plugin receives the request at `/api/v1/message-jobs`
3. Plugin loads the `.txt` template from `templates/whatsapp_templates/`
4. Template is rendered with Handlebars using the payload data
5. Message is sent via WhatsApp Cloud API

## Testing

After fixing the TEMPLATE_DIR, restart the WhatsApp plugin:
```bash
cd whatsapp_plugin
npm start
```

Then test with a POST request to `http://localhost:4100/api/v1/message-jobs` with payload like:
```json
{
  "tenantId": "school123",
  "type": "transactional",
  "templateName": "attendance_alert",
  "language": "en_US",
  "payload": {
    "parent_name": "John Doe",
    "student_name": "Jane Doe",
    "status": "absent",
    "date": "2025-11-05"
  },
  "recipients": [
    {
      "phone": "+1234567890",
      "name": "John Doe"
    }
  ]
}
```
