# WhatsApp Template Setup Guide

## Overview

WhatsApp Cloud API requires all message templates to be **pre-approved by Meta** before you can use them. This guide walks you through the complete setup process.

## Important Concepts

### Two-Part Template System

1. **Meta Template (Required)**: Registered and approved in Meta Business Manager
   - Uses numbered placeholders: `{{1}}`, `{{2}}`, `{{3}}`
   - Must be approved by Meta before use
   - Cannot be changed without re-approval

2. **Local Template File (Optional)**: Your `.txt` file in `templates/whatsapp_templates/`
   - Uses Handlebars syntax: `{{parent_name}}`, `{{student_name}}`
   - Maps your JSON payload to WhatsApp's numbered parameters
   - Can be changed anytime without approval

## Step-by-Step Setup

### Step 1: Access Meta Business Manager

1. Go to https://business.facebook.com/
2. Log in with your Facebook account
3. Select your business account
4. Navigate to **WhatsApp Manager** (or WhatsApp Accounts)

### Step 2: Access Message Templates

1. In WhatsApp Manager, click on your WhatsApp Business Account
2. Go to **Account tools** → **Message templates**
3. Click **Create template** button

### Step 3: Create Template - Basic Info

1. **Template name**: `attendance_alert` (lowercase, underscores only, no spaces)
2. **Category**: Select one:
   - **UTILITY**: For account updates, alerts, reminders (recommended for attendance)
   - **MARKETING**: For promotional messages
   - **AUTHENTICATION**: For OTP/verification codes
3. **Languages**: Select `English (US)` or your preferred language
4. Click **Continue**

### Step 4: Create Template - Content

#### Header (Optional)
- Choose: Text, Image, Video, or Document
- For attendance alerts, you can skip this or add: `Attendance Alert`

#### Body (Required)
Enter your message with numbered placeholders:

```
Hello {{1}}, your child {{2}} was marked {{3}} on {{4}}.
```

**Parameter mapping**:
- `{{1}}` = parent_name
- `{{2}}` = student_name
- `{{3}}` = status (Present/Absent)
- `{{4}}` = date

**Important Rules**:
- Use `{{1}}`, `{{2}}`, `{{3}}` etc. (numbered placeholders)
- Maximum 1024 characters
- No HTML or special formatting
- Emojis are allowed ✅

#### Footer (Optional)
Add a footer like: `School ERP System` or `Reply STOP to unsubscribe`

#### Buttons (Optional)
- **Call to action**: Add URL or phone number buttons
- **Quick reply**: Add quick response buttons

#### Sample Content (Required)
Provide example values for review:
- `{{1}}`: Mrs. Sharma
- `{{2}}`: Rahul
- `{{3}}`: Absent
- `{{4}}`: 2025-11-05

### Step 5: Submit for Review

1. Review your template
2. Click **Submit**
3. Wait for approval (usually 15 minutes to 24 hours)
4. Check status in Message Templates section

### Step 6: Create Local Template File

Once approved by Meta, create your local template file:

**File**: `whatsapp_plugin/templates/whatsapp_templates/attendance_alert.en_US.txt`

```
Hello {{parent_name}}, your child {{student_name}} was marked {{status}} on {{date}}.
```

**Naming convention**: `{template_name}.{language_code}.txt`
- `attendance_alert` = template name (must match Meta)
- `en_US` = language code (must match Meta)
- `.txt` = file extension

### Step 7: Test Your Template

Use this JSON payload to test:

```json
{
  "tenantId": "demo-school",
  "type": "transactional",
  "templateName": "attendance_alert",
  "language": "en_US",
  "payload": {
    "parent_name": "Mrs. Sharma",
    "student_name": "Rahul",
    "status": "Absent",
    "date": "2025-11-05"
  },
  "recipients": [
    {
      "phone": "+918850623515",
      "name": "Mrs. Sharma"
    }
  ]
}
```

Send POST request to: `http://localhost:4100/api/v1/message-jobs`

## Common Templates for School ERP

### 1. Attendance Alert

**Meta Template Body**:
```
Hello {{1}}, your child {{2}} was marked {{3}} on {{4}}.
```

**Local File** (`attendance_alert.en_US.txt`):
```
Hello {{parent_name}}, your child {{student_name}} was marked {{status}} on {{date}}.
```

### 2. Fee Reminder

**Meta Template Body**:
```
Dear {{1}}, a fee payment of ₹{{2}} is due for {{3}} by {{4}}. Please pay at your earliest convenience.
```

**Local File** (`fee_reminder.en_US.txt`):
```
Dear {{parent_name}}, a fee payment of ₹{{amount}} is due for {{student_name}} by {{due_date}}. Please pay at your earliest convenience.
```

### 3. Exam Schedule

**Meta Template Body**:
```
Hello {{1}}, {{2}}'s {{3}} exam is scheduled on {{4}} at {{5}}. Venue: {{6}}.
```

**Local File** (`exam_schedule.en_US.txt`):
```
Hello {{parent_name}}, {{student_name}}'s {{subject}} exam is scheduled on {{exam_date}} at {{exam_time}}. Venue: {{venue}}.
```

### 4. Leave Approval

**Meta Template Body**:
```
Dear {{1}}, your leave request for {{2}} from {{3}} to {{4}} has been {{5}}.
```

**Local File** (`leave_approval.en_US.txt`):
```
Dear {{parent_name}}, your leave request for {{student_name}} from {{start_date}} to {{end_date}} has been {{status}}.
```

## Template Status & Troubleshooting

### Template Status Types

- **PENDING**: Under review by Meta
- **APPROVED**: Ready to use
- **REJECTED**: Not approved (check rejection reason)
- **PAUSED**: Temporarily disabled due to quality issues
- **DISABLED**: Permanently disabled

### Common Rejection Reasons

1. **Policy Violations**:
   - Contains promotional content in UTILITY category
   - Misleading or deceptive content
   - Violates WhatsApp Commerce Policy

2. **Format Issues**:
   - Too many variables (max 10 per template)
   - Invalid placeholder format
   - Missing sample content

3. **Content Issues**:
   - Vague or unclear message
   - Grammar or spelling errors
   - Inappropriate language

### Error: "Template name does not exist"

**Cause**: Template not created or not approved in Meta

**Solution**:
1. Check template status in Meta Business Manager
2. Ensure template name matches exactly (case-sensitive)
3. Verify language code matches (`en_US`, not `en`)
4. Wait for approval if status is PENDING

### Error: "Template parameter count mismatch"

**Cause**: Number of parameters in your payload doesn't match template

**Solution**:
1. Count placeholders in Meta template: `{{1}}`, `{{2}}`, etc.
2. Ensure your local template has same number of variables
3. Verify payload contains all required fields

## Best Practices

### Template Design

1. **Keep it concise**: Short messages have better engagement
2. **Clear call-to-action**: Tell users what to do next
3. **Personalization**: Use variables for names and specific details
4. **Professional tone**: Maintain formal language for school communications
5. **Add context**: Include relevant details (dates, amounts, etc.)

### Template Management

1. **Version control**: Keep local templates in git
2. **Documentation**: Document what each variable means
3. **Testing**: Test with real data before production use
4. **Monitoring**: Track template performance and quality ratings
5. **Updates**: Plan for template updates (requires re-approval)

### Compliance

1. **Opt-in required**: Only message users who opted in
2. **24-hour window**: Template messages can be sent anytime
3. **Quality rating**: Maintain high quality to avoid restrictions
4. **Rate limits**: Respect WhatsApp's rate limits
5. **User privacy**: Don't share sensitive information

## Testing with Pre-Approved Templates

WhatsApp test accounts come with a pre-approved `hello_world` template. Use it for initial testing:

**Test Payload**:
```json
{
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
}
```

## Getting Help

### Meta Resources

- **WhatsApp Business API Documentation**: https://developers.facebook.com/docs/whatsapp
- **Message Templates Guide**: https://developers.facebook.com/docs/whatsapp/message-templates
- **Policy Guidelines**: https://www.whatsapp.com/legal/commerce-policy

### Support Channels

- **Meta Business Help Center**: https://www.facebook.com/business/help
- **WhatsApp Business API Support**: Available in Business Manager
- **Developer Community**: https://developers.facebook.com/community/

## Checklist

Before going live, ensure:

- [ ] All templates created in Meta Business Manager
- [ ] All templates approved (status: APPROVED)
- [ ] Local `.txt` files created for each template
- [ ] Template names match exactly between Meta and local files
- [ ] Language codes match (e.g., `en_US`)
- [ ] All variables mapped correctly
- [ ] Tested with sample data
- [ ] Access token is valid and not expired
- [ ] Phone number ID is correct in `.env`
- [ ] Users have opted in to receive messages
- [ ] Compliance with WhatsApp policies verified

## Next Steps

1. Create your first template in Meta Business Manager
2. Wait for approval
3. Create corresponding local `.txt` file
4. Test with the provided payload
5. Monitor message delivery and quality ratings
6. Create additional templates as needed

For technical issues, see `TROUBLESHOOTING.md`
