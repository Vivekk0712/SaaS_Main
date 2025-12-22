# Test script for Digital Diary WhatsApp Notifications

Write-Host "Testing Digital Diary WhatsApp Notifications..." -ForegroundColor Cyan

Write-Host "`n=== Prerequisites ===" -ForegroundColor Yellow
Write-Host "1. WhatsApp plugin running on port 3002" -ForegroundColor White
Write-Host "2. WhatsApp Business API configured" -ForegroundColor White
Write-Host "3. Template 'assignment_update' approved in Meta" -ForegroundColor White
Write-Host "4. Students with parent phone numbers in database" -ForegroundColor White

Write-Host "`n=== Test Flow ===" -ForegroundColor Yellow

Write-Host "`n1. Teacher Publishes Assignment:" -ForegroundColor Green
Write-Host "   - Go to http://localhost:3000/teacher/diary" -ForegroundColor White
Write-Host "   - Fill in: Date, Class, Section, Subject" -ForegroundColor White
Write-Host "   - Add description and/or files" -ForegroundColor White
Write-Host "   - Click 'Publish for selected date'" -ForegroundColor White
Write-Host "   - See success message" -ForegroundColor White

Write-Host "`n2. Send Notifications:" -ForegroundColor Green
Write-Host "   - After publishing, see green button: '📱 Send WhatsApp Notifications'" -ForegroundColor White
Write-Host "   - Click the button" -ForegroundColor White
Write-Host "   - Button shows '⏳ Sending...'" -ForegroundColor White
Write-Host "   - Wait for completion" -ForegroundColor White

Write-Host "`n3. Check Results:" -ForegroundColor Green
Write-Host "   - See message: '✓ Notifications sent! Sent: X, Skipped: Y, Failed: Z'" -ForegroundColor White
Write-Host "   - Check server logs for details" -ForegroundColor White
Write-Host "   - Parents receive WhatsApp message" -ForegroundColor White

Write-Host "`n=== Expected WhatsApp Message ===" -ForegroundColor Yellow
Write-Host @"
New assignment has been published.

Subject: Physics
Class: CLASS 1 - A
Date: 22-12-2025

Please check the assignment details in the ERP.
"@ -ForegroundColor White

Write-Host "`n=== API Test (Manual) ===" -ForegroundColor Yellow
Write-Host "Test the notification API directly:" -ForegroundColor White
Write-Host @"
`$response = Invoke-RestMethod -Uri "http://localhost:3000/api/diary/notify" ``
    -Method POST ``
    -ContentType "application/json" ``
    -Body (@{
        klass = "CLASS 1"
        section = "A"
        subject = "Physics"
        date = "2025-12-22"
    } | ConvertTo-Json)

`$response | ConvertTo-Json -Depth 3
"@ -ForegroundColor Cyan

Write-Host "`n=== Expected API Response ===" -ForegroundColor Yellow
Write-Host @"
{
  "success": true,
  "message": "Notifications sent successfully",
  "sent": 25,
  "skipped": 3,
  "failed": 0,
  "total": 28
}
"@ -ForegroundColor White

Write-Host "`n=== Troubleshooting ===" -ForegroundColor Yellow

Write-Host "`nIf no button appears:" -ForegroundColor Red
Write-Host "  - Make sure you clicked 'Publish' first" -ForegroundColor White
Write-Host "  - Check browser console for errors" -ForegroundColor White
Write-Host "  - Refresh the page and try again" -ForegroundColor White

Write-Host "`nIf notifications fail:" -ForegroundColor Red
Write-Host "  - Check WhatsApp plugin is running: http://localhost:3002/health" -ForegroundColor White
Write-Host "  - Verify template 'assignment_update' is approved" -ForegroundColor White
Write-Host "  - Check parent phone numbers exist in database" -ForegroundColor White
Write-Host "  - Check server logs for detailed errors" -ForegroundColor White

Write-Host "`nIf 'Skipped' count is high:" -ForegroundColor Red
Write-Host "  - Students don't have parent phone numbers" -ForegroundColor White
Write-Host "  - Add phone numbers in database: parents table" -ForegroundColor White
Write-Host "  - Link students to parents: students.guardian_id" -ForegroundColor White

Write-Host "`n=== Database Check ===" -ForegroundColor Yellow
Write-Host "Verify students have parent phone numbers:" -ForegroundColor White
Write-Host @"
SELECT 
  s.usn,
  s.name as student_name,
  p.phone as parent_phone,
  p.name as parent_name
FROM students s
LEFT JOIN parents p ON s.guardian_id = p.id
WHERE s.class_id = (SELECT id FROM classes WHERE name = 'CLASS 1')
  AND s.section_id = (SELECT id FROM sections WHERE name = 'A')
  AND s.status = 'active';
"@ -ForegroundColor Cyan

Write-Host "`n=== Environment Variables ===" -ForegroundColor Yellow
Write-Host "Required in .env:" -ForegroundColor White
Write-Host "WHATSAPP_PLUGIN_URL=http://localhost:3002" -ForegroundColor Cyan
Write-Host "DB_HOST=localhost" -ForegroundColor Cyan
Write-Host "DB_USER=root" -ForegroundColor Cyan
Write-Host "DB_PASSWORD=" -ForegroundColor Cyan
Write-Host "DB_NAME=school_management" -ForegroundColor Cyan

Write-Host "`n=== Ready to Test! ===" -ForegroundColor Green
Write-Host "Start your services and follow the test flow above." -ForegroundColor White
