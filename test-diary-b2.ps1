# Test script for Digital Diary B2 integration
# This verifies that diary file uploads work with Backblaze B2

Write-Host "Testing Digital Diary B2 Integration..." -ForegroundColor Cyan

Write-Host "`n=== Test Steps ===" -ForegroundColor Yellow

Write-Host "`n1. Teacher Upload Test:" -ForegroundColor Green
Write-Host "   - Go to http://localhost:3000/teacher/diary" -ForegroundColor White
Write-Host "   - Login as teacher" -ForegroundColor White
Write-Host "   - Select date, class, section, subject" -ForegroundColor White
Write-Host "   - Add description text" -ForegroundColor White
Write-Host "   - Click 'Choose Files' and select a PDF" -ForegroundColor White
Write-Host "   - Watch for upload progress messages" -ForegroundColor White
Write-Host "   - Click 'Publish for selected date'" -ForegroundColor White
Write-Host "   - Verify file shows with 'Download' button" -ForegroundColor White

Write-Host "`n2. Student Download Test:" -ForegroundColor Green
Write-Host "   - Go to http://localhost:3000/student/diary" -ForegroundColor White
Write-Host "   - Login as student from same class/section" -ForegroundColor White
Write-Host "   - Select the date with diary entry" -ForegroundColor White
Write-Host "   - See the diary entry with attachments" -ForegroundColor White
Write-Host "   - Click 'Download' button on file" -ForegroundColor White
Write-Host "   - File should open in new tab from B2" -ForegroundColor White
Write-Host "   - Verify file downloads correctly" -ForegroundColor White

Write-Host "`n3. Check B2 Storage:" -ForegroundColor Green
Write-Host "   - Login to Backblaze B2 console" -ForegroundColor White
Write-Host "   - Navigate to your bucket" -ForegroundColor White
Write-Host "   - Look for: school-erp/{class}/{section}/{subject}/materials/diary-{date}/" -ForegroundColor White
Write-Host "   - Verify file exists with timestamp prefix" -ForegroundColor White

Write-Host "`n=== Expected Behavior ===" -ForegroundColor Yellow
Write-Host "✅ Teacher sees upload progress (0% to 100%)" -ForegroundColor White
Write-Host "✅ Success message: 'X file(s) uploaded'" -ForegroundColor White
Write-Host "✅ File appears with Download button" -ForegroundColor White
Write-Host "✅ Student sees diary entry with file attachment" -ForegroundColor White
Write-Host "✅ Download button shows 'Loading...' then opens file" -ForegroundColor White
Write-Host "✅ File opens in new tab from B2 signed URL" -ForegroundColor White
Write-Host "✅ File is stored in B2 bucket (not localStorage)" -ForegroundColor White

Write-Host "`n=== Troubleshooting ===" -ForegroundColor Yellow
Write-Host "If upload fails:" -ForegroundColor Red
Write-Host "  - Check B2 credentials in .env file" -ForegroundColor White
Write-Host "  - Verify B2_BUCKET_NAME, B2_KEY_ID, B2_APPLICATION_KEY" -ForegroundColor White
Write-Host "  - Check browser console for errors" -ForegroundColor White
Write-Host "  - Check Next.js server logs" -ForegroundColor White

Write-Host "`nIf download fails:" -ForegroundColor Red
Write-Host "  - Check if file exists in B2 bucket" -ForegroundColor White
Write-Host "  - Verify B2 credentials are correct" -ForegroundColor White
Write-Host "  - Check browser console for 'Download error'" -ForegroundColor White
Write-Host "  - Try clicking Download again (signed URL may have expired)" -ForegroundColor White

Write-Host "`n=== Environment Check ===" -ForegroundColor Yellow

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
    
    # Check for B2 variables
    $envContent = Get-Content ".env" -Raw
    
    if ($envContent -match "B2_BUCKET_NAME=") {
        Write-Host "✅ B2_BUCKET_NAME configured" -ForegroundColor Green
    } else {
        Write-Host "❌ B2_BUCKET_NAME not found in .env" -ForegroundColor Red
    }
    
    if ($envContent -match "B2_KEY_ID=") {
        Write-Host "✅ B2_KEY_ID configured" -ForegroundColor Green
    } else {
        Write-Host "❌ B2_KEY_ID not found in .env" -ForegroundColor Red
    }
    
    if ($envContent -match "B2_APPLICATION_KEY=") {
        Write-Host "✅ B2_APPLICATION_KEY configured" -ForegroundColor Green
    } else {
        Write-Host "❌ B2_APPLICATION_KEY not found in .env" -ForegroundColor Red
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
}

Write-Host "`n=== Ready to Test! ===" -ForegroundColor Cyan
Write-Host "Start your dev server with: npm run dev" -ForegroundColor White
Write-Host "Then follow the test steps above." -ForegroundColor White
