# WhatsApp Plugin for School ERP

A Node.js/TypeScript plugin for sending WhatsApp notifications via Meta's WhatsApp Cloud API.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your credentials:
```env
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
```

### 3. Start the Server
```bash
npm run dev
```

Server runs on http://localhost:4100

### 4. Test with Pre-Approved Template
Open http://localhost:4100 and click "Click here to test with hello_world template"

## 📋 Current Status

✅ Plugin configured and running  
✅ Local templates created  
✅ API endpoints working  
✅ **Meta template created** (`attendance_alert` with language `en`)  
⏳ **Waiting for Meta approval** (check status in Meta Business Manager)

## ⚠️ Important: Template Configuration

Your `attendance_alert` template has been created in Meta Business Manager:

### Template Details
- **Message**: "Attendance alert: {{1}} was marked {{2}} on {{3}} as per school records."
- **Language**: `en` (English) - **Note**: Not `en_US`
- **Parameters**: student_name, status, date

### Usage
Use `"language": "en"` in your API calls (not `en_US`).

**See `TEMPLATE_UPDATE.md` for complete details.**

## 📚 Documentation

- **`QUICK_START.md`** - Get started in 5 minutes
- **`FIX_TEMPLATE_ERROR.md`** - Fix the template error
- **`TEMPLATE_SETUP_GUIDE.md`** - Complete template creation guide
- **`TROUBLESHOOTING.md`** - Common issues and solutions

## 🔧 API Usage

### Send a Message
```bash
POST http://localhost:4100/api/v1/message-jobs
Content-Type: application/json

{
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
      "phone": "+918850623515",
      "name": "Parent Name"
    }
  ]
}
```

### Message Types
- **transactional**: Single template message (attendance alerts, etc.)
- **bulk**: Multiple recipients with personalization
- **session_text**: Free-form text (requires 24h customer session)

## 📝 Templates

### Available Templates
- ✅ `hello_world` - Pre-approved test template (language: `en_US`)
- ⏳ `attendance_alert` - Created, waiting for approval (language: `en`)

### Create New Templates
1. Go to https://business.facebook.com/
2. Navigate to WhatsApp Manager → Message templates
3. Create template with numbered placeholders: `{{1}}`, `{{2}}`
4. Wait for approval (15 min - 24 hours)
5. Create matching `.txt` file in `templates/whatsapp_templates/`

See `TEMPLATE_SETUP_GUIDE.md` for detailed instructions.

## 🏗️ Project Structure

```
whatsapp_plugin/
├── src/
│   ├── clients/          # WhatsApp API client
│   ├── services/         # Business logic
│   ├── routes/           # API endpoints
│   └── index.ts          # Entry point
├── templates/
│   └── whatsapp_templates/  # Local template files
├── public/               # Test UI
├── tests/                # Unit tests
└── .env                  # Configuration
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test with UI
1. Open http://localhost:4100
2. Fill in the form
3. Click "Send Test WhatsApp"

### Test with cURL
```bash
curl -X POST http://localhost:4100/api/v1/message-jobs \
  -H "Content-Type: application/json" \
  -d @test-payload.json
```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `WHATSAPP_PHONE_NUMBER_ID` | Your WhatsApp Business phone number ID | Yes |
| `WHATSAPP_ACCESS_TOKEN` | Meta access token | Yes |
| `PORT` | Server port (default: 4100) | No |
| `TEMPLATE_DIR` | Template directory path | No |
| `QUEUE_MODE` | Queue mode: inline or redis | No |

## 🚦 Next Steps

1. ✅ Test with `hello_world` template
2. 📝 Create `attendance_alert` template in Meta
3. ⏳ Wait for approval
4. 🎉 Test your custom template
5. 📋 Create additional templates as needed

## 📖 Additional Resources

- [WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp)
- [Message Templates Guide](https://developers.facebook.com/docs/whatsapp/message-templates)
- [Meta Business Manager](https://business.facebook.com/)

## 🐛 Troubleshooting

### Template not found error?
See `FIX_TEMPLATE_ERROR.md`

### Other issues?
See `TROUBLESHOOTING.md`

### Need help with templates?
See `TEMPLATE_SETUP_GUIDE.md`

## 📄 License

MIT
