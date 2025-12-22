# Debug: Diary Download Button Not Showing

## Issue
Student diary page shows the assignment but no download button appears for file attachments.

## Changes Made

### 1. Added Debug Logging
Added `console.log('Attachment:', a)` to see attachment structure in browser console.

### 2. Improved Button Styling
Changed button class from `back` to `btn-ghost` with explicit styling:
```typescript
<button
  className="btn-ghost"
  style={{ 
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: 600
  }}
>
  📥 Download
</button>
```

### 3. Fixed Layout
Wrapped button in `<div style={{ flexShrink: 0 }}>` to prevent it from being hidden.

## How to Debug

### Step 1: Check Browser Console
1. Open student diary page
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for logs like: `Attachment: { type: 'file', name: '...', dataUrl: '...' }`

### Step 2: Verify Attachment Structure
The attachment should have:
```javascript
{
  type: 'file',
  name: 'homework.pdf',
  mime: 'application/pdf',
  dataUrl: 'school-erp/CLASS 1/A/PHY/materials/diary-2025-12-22/...',
  b2Key: 'school-erp/...',
  fileSize: 123456
}
```

### Step 3: Check if Button Renders
1. Right-click on the file attachment area
2. Select "Inspect Element"
3. Look for `<button class="btn-ghost">📥 Download</button>`
4. If button exists but not visible, check CSS

### Step 4: Test Download
1. Click the Download button
2. Should show "⏳ Loading..."
3. Then file should open in new tab
4. If error: "❌ Error - Retry"

## Common Issues

### Issue 1: Button Not Rendering
**Symptom:** No button element in DOM
**Cause:** `a.type` is not 'file'
**Fix:** Check console log - attachment type might be wrong

### Issue 2: Button Renders But Hidden
**Symptom:** Button in DOM but not visible
**Cause:** CSS overflow or z-index issue
**Fix:** Added `flexShrink: 0` wrapper

### Issue 3: Download Fails
**Symptom:** Button shows "❌ Error - Retry"
**Cause:** B2 credentials or signed URL generation failed
**Fix:** Check B2 environment variables

### Issue 4: No dataUrl Property
**Symptom:** Console shows attachment without `dataUrl`
**Cause:** Old diary entry format
**Fix:** Re-upload the file from teacher diary

## Expected Console Output

When viewing a diary entry with file attachment:
```
Attachment: {
  type: 'file',
  name: 'newtons_laws_of_motion.pdf',
  mime: 'application/pdf',
  dataUrl: 'school-erp/CLASS 1/A/PHY/materials/1766408930072_newtons_laws_of_motion.pdf',
  b2Key: 'school-erp/CLASS 1/A/PHY/materials/1766408930072_newtons_laws_of_motion.pdf',
  fileSize: 1234567
}
```

## Visual Check

The attachment should look like:
```
┌─────────────────────────────────────────────────┐
│ File  newtons_laws_of_motion.pdf  [📥 Download] │
└─────────────────────────────────────────────────┘
```

## Test Steps

1. **Teacher Side:**
   - Go to `/teacher/diary`
   - Upload a PDF file
   - Publish diary entry
   - Verify file shows with Download button

2. **Student Side:**
   - Go to `/student/diary`
   - Select the date
   - See diary entry
   - **Should see:** `📥 Download` button
   - Click button
   - File should open in new tab

## Quick Fix

If button still not showing, try this temporary fix:

Replace the conditional rendering with:
```typescript
{a.type === 'link' ? (
  <a className="btn-ghost" href={a.url} target="_blank">Open</a>
) : a.type === 'file' ? (
  <FileDownloadButton file={a} />
) : (
  <span className="note">Unknown type: {a.type}</span>
)}
```

This will show what type the attachment actually is.

## Environment Check

Verify these are set in `.env`:
```env
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_REGION=us-west-004
B2_BUCKET_NAME=your-bucket
B2_KEY_ID=your-key-id
B2_APPLICATION_KEY=your-app-key
```

## Next Steps

1. Check browser console for attachment structure
2. Verify button element exists in DOM
3. Test download functionality
4. Report findings with console output

If button still doesn't show, share the console output from the attachment log!
