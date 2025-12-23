# WhatsApp Notification Test - Real Phone Numbers

## 📱 Test Target

**Real Phone Numbers:**
- `+918850623515` - Ananya Gupta (Parent of Aditya Kumar, USN: 1A01)
- `+919867805724` - Rahul Nair (Parent of Nisha Naik, USN: 1A02)

**Class:** CLASS 1, Section A

⚠️ **WARNING:** These are REAL phone numbers. Messages will be sent to actual people!

---

## 🚀 Quick Test (Automated)

### Option 1: Test Both Numbers
```powershell
.\test-real-whatsapp-notifications.ps1
```

This will:
1. Check WhatsApp plugin is running
2. Check database connection
3. Send notifications to both parents
4. Show results

### Option 2: Test Single Number
```powershell
.\test-single-whatsapp.ps1
```

This will:
1. Let you choose which number to test
2. Send a single test message
3. Show the response

---

## 📋 Prerequisites

### 1. WhatsApp Plugin Running
```powershell
# Start WhatsApp plugin
npm run dev -w whatsapp_plugin

# Or use dev stack
npm run dev:stack
```

### 2. Template Approved
- Template name: `assignment_update`
- Status: ✅ Approved in Meta Business Manager
- Language: English (en)

### 3. Next.js App Running
```powershell
npm run dev
```

### 4. Database Setup
- Students 1A01 and 1A02 exist
- Parents linked with correct phone numbers
- Class 1, Section A exists

---

## 🧪 Manual Test Steps

### Step 1: Verify Database
```sql
-- Check students and parent phones
SELECT 
  s.usn,
  s.name as student,
  p.name as parent,
  p.phone
FROM students s
LEFT JOIN parents p ON s.guardian_id = p.id
WHERE s.usn IN ('1A01', '1A02');
```

Expected output:
```
+------+--------------+--------------+--------------+
| usn  | student      | parent       | phone        |
+------+--------------+--------------+--------------+
| 1A01 | Aditya Kumar | Ananya Gupta | 918850623515 |
| 1A02 | Nisha Naik   | Rahul Nair   | 919867805724 |
+------+--------------+--------------+--------------+
```

### Step 2: Test API Directly
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/diary/notify" `
    -Method POST `
    -ContentType "application/json" `
    -Body (@{
        klass = "CLASS 1"
        section = "A"
        subject = "Physics"
        date = "2025-12-23"
    } | ConvertTo-Json)

$response | ConvertTo-Json
```

Expected response:
```json
{
  "success": true,
  "message": "Notifications sent successfully",
  "sent": 2,
  "skipped": 0,
  "failed": 0,
  "total": 2
}
```

### Step 3: Test from Teacher UI

1. **Login as Teacher**
   - Go to `http://localhost:3000/teacher/diary`

2. **Fill Form**
   - Date: Today's date
   - Class: CLASS 1
   - Section: A
   - Subject: Physics
   - Description: "Complete homework on Newton's Laws"

3. **Publish**
   - Click "Publish for selected date"
   - See success message

4. **Send Notifications**
   - Green button appears: "📱 Send WhatsApp Notifications"
   - Click the button
   - Wait for "✓ Notifications sent! Sent: 2, Skipped: 0, Failed: 0"

### Step 4: Verify on WhatsApp

Check these phones receive the message:
- **+918850623515** (Ananya Gupta)
- **+919867805724** (Rahul Nair)

Expected message:
```
New assignment has been published.

Subject: Physics
Class: CLASS 1 - A
Date: 23-12-2025

Please check the assignment details in the ERP.
```

---

## 🔍 Troubleshooting

### Issue 1: No Messages Sent (sent: 0)

**Check:**
```sql
-- Verify parent phones exist
SELECT s.usn, p.phone 
FROM students s 
LEFT JOIN parents p ON s.guardian_id = p.id 
WHERE s.class_id = 1 AND s.section_id = 1;
```

**Fix:** Add phone numbers if missing

### Issue 2: Template Not Found

**Error:** `Template 'assignment_update' not found`

**Fix:**
1. Check template name in Meta Business Manager
2. Verify it's approved
3. Check spelling matches exactly

### Issue 3: WhatsApp Plugin Not Running

**Error:** `Failed to connect to http://localhost:3002`

**Fix:**
```powershell
# Start WhatsApp plugin
cd whatsapp_plugin
npm install
npm run dev
```

### Issue 4: Invalid Phone Number Format

**Error:** `Invalid phone number`

**Fix:** Phone numbers should be:
- Format: `918850623515` (no + or spaces)
- Or: `+918850623515` (with +)
- Country code: 91 (India)

---

## 📊 Expected Results

### Success Scenario
```
✓ WhatsApp plugin: Running
✓ Database: Connected
✓ API: Called successfully
✓ Messages: Sent to 2 parent(s)

Sent: 2
Skipped: 0
Failed: 0
Total: 2
```

### Partial Success
```
⚠️ Partial success

Sent: 1
Skipped: 0
Failed: 1
Total: 2
```

Check WhatsApp plugin logs for failure reason.

### Complete Failure
```
❌ No messages sent

Sent: 0
Skipped: 2
Failed: 0
Total: 2
```

Likely cause: Phone numbers missing or invalid.

---

## 🎯 Test Checklist

Before testing:
- [ ] WhatsApp plugin running on port 3002
- [ ] Next.js app running on port 3000
- [ ] Template `assignment_update` approved in Meta
- [ ] Database has students 1A01 and 1A02
- [ ] Parents have correct phone numbers
- [ ] WhatsApp Business API configured

During test:
- [ ] Run test script
- [ ] Check API response
- [ ] Verify sent count = 2
- [ ] Check WhatsApp plugin logs
- [ ] Confirm messages received on phones

After test:
- [ ] Messages received on both phones
- [ ] Message format correct
- [ ] Subject, class, date correct
- [ ] No errors in logs

---

## 📱 Phone Number Details

### Phone 1: Ananya Gupta
- **Number:** +918850623515
- **Student:** Aditya Kumar (1A01)
- **Class:** CLASS 1, Section A
- **Relationship:** Parent

### Phone 2: Rahul Nair
- **Number:** +919867805724
- **Student:** Nisha Naik (1A02)
- **Class:** CLASS 1, Section A
- **Relationship:** Parent

---

## 🔐 Security Notes

- These are real phone numbers - use responsibly
- Don't spam with test messages
- Test during reasonable hours
- Inform parents before testing
- Keep phone numbers confidential

---

## 📝 Test Log Template

```
Date: ___________
Time: ___________
Tester: ___________

Pre-test Checks:
[ ] WhatsApp plugin running
[ ] Database verified
[ ] Template approved

Test Results:
Sent: ___
Skipped: ___
Failed: ___

Phone 1 (+918850623515):
[ ] Message received
[ ] Content correct
[ ] Timing acceptable

Phone 2 (+919867805724):
[ ] Message received
[ ] Content correct
[ ] Timing acceptable

Issues Found:
_________________________________
_________________________________

Notes:
_________________________________
_________________________________
```

---

## 🚀 Quick Commands

```powershell
# Full test (both numbers)
.\test-real-whatsapp-notifications.ps1

# Single number test
.\test-single-whatsapp.ps1

# Check WhatsApp plugin
curl http://localhost:3002/health

# Check database
mysql -u sas_app -p sas -e "SELECT s.usn, p.phone FROM students s LEFT JOIN parents p ON s.guardian_id = p.id WHERE s.usn IN ('1A01', '1A02');"

# View WhatsApp plugin logs
# Check the terminal where whatsapp_plugin is running
```

---

## ✅ Success Criteria

Test is successful when:
1. ✅ API returns `sent: 2`
2. ✅ Both phones receive WhatsApp message
3. ✅ Message content is correct
4. ✅ No errors in logs
5. ✅ Delivery confirmed in WhatsApp plugin

---

## 📞 Support

If issues persist:
1. Check WhatsApp plugin logs
2. Verify Meta Business Manager settings
3. Test with WhatsApp Business API sandbox
4. Check phone number format
5. Verify template approval status

---

## 🎉 Ready to Test!

Run the test script:
```powershell
.\test-real-whatsapp-notifications.ps1
```

Good luck! 🚀
