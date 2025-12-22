# Digital Diary Upload - Step by Step Test

## Issue Found
The diary entry was published but attachments weren't included. This happens when:
1. File is still uploading when "Publish" is clicked
2. Upload completes but attachments state isn't updated
3. Publish happens with empty attachments array

## Solution Applied
- Added `uploading` state to track upload progress
- Disabled "Publish" button while uploading
- Button shows "⏳ Uploading files..." during upload
- Added console logs for debugging

## Test Steps

### Step 1: Teacher Upload (CORRECT WAY)

1. **Go to Teacher Diary**
   ```
   http://localhost:3000/teacher/diary
   ```

2. **Fill in Details**
   - Select date: Today's date
   - Select class: CLASS 1
   - Select section: A
   - Select subject: PHY
   - Enter description: "Newtons laws of motion homework"

3. **Upload File**
   - Click "Choose Files"
   - Select a PDF file
   - **WAIT** for upload to complete
   - You should see messages:
     - "Uploading filename.pdf... 0%"
     - "Uploading filename.pdf... 50%"
     - "Uploading filename.pdf... 100%"
     - "1 file(s) uploaded."

4. **Verify File Appears**
   - File should appear in attachments list
   - Should show: `File  filename.pdf  [Download]`
   - **DO NOT CLICK PUBLISH YET**

5. **Check Console (F12)**
   - Open browser console
   - You should see the file in attachments list

6. **Click Publish**
   - Button should say "Publish for selected date"
   - If it says "⏳ Uploading files..." - WAIT!
   - Click "Publish for selected date"
   - Should see: "Diary updated for the selected date."

7. **Check Console Logs**
   ```
   Saving diary with attachments: [{type: 'file', name: '...', dataUrl: '...'}]
   Diary entry: {subject: 'PHY', teacher: '...', note: '...', attachments: [...]}
   ```

### Step 2: Student View

1. **Go to Student Diary**
   ```
   http://localhost:3000/student/diary
   ```

2. **Select Same Date**
   - Use date picker to select the date you published

3. **Check Diary Entry**
   - Should see: "PHY - Updated by [Teacher Name]"
   - Should see: "Newtons laws of motion homework"
   - **Should see attachment:**
     ```
     File  filename.pdf  [📥 Download]
     ```

4. **Check Console (F12)**
   ```
   Attachment: {
     type: 'file',
     name: 'filename.pdf',
     dataUrl: 'school-erp/CLASS 1/A/PHY/materials/...',
     b2Key: '...',
     fileSize: 123456
   }
   ```

5. **Test Download**
   - Click "📥 Download" button
   - Should show "⏳ Loading..."
   - File should open in new tab
   - File should download from B2

## Common Mistakes

### ❌ Mistake 1: Publishing Too Early
**Problem:** Click "Publish" before upload completes
**Result:** Diary saved without attachments
**Solution:** Wait for "X file(s) uploaded" message

### ❌ Mistake 2: Not Waiting for State Update
**Problem:** Upload completes but attachments not in state
**Result:** Publish button enabled but attachments empty
**Solution:** Check attachments list shows the file before publishing

### ❌ Mistake 3: Browser Cache
**Problem:** Old code cached in browser
**Result:** New features don't work
**Solution:** Hard refresh (Ctrl+F5) or clear cache

## Debugging Checklist

### Teacher Side
- [ ] File upload shows progress (0% to 100%)
- [ ] Success message: "1 file(s) uploaded"
- [ ] File appears in attachments list with Download button
- [ ] Publish button disabled during upload
- [ ] Console shows: "Saving diary with attachments: [...]"
- [ ] Console shows attachments array is NOT empty

### Student Side
- [ ] Diary entry appears for the date
- [ ] Attachment section shows
- [ ] Console shows: "Attachment: {...}"
- [ ] Attachment has `dataUrl` property
- [ ] Download button appears: "📥 Download"
- [ ] Click download opens file in new tab

## If Still Not Working

### Check 1: Verify Upload Completed
```javascript
// In teacher diary, before clicking Publish, check console:
console.log(attachments)
// Should show: [{type: 'file', name: '...', dataUrl: '...'}]
```

### Check 2: Verify Diary Entry Saved
```javascript
// In student diary, check console:
console.log('Attachment:', a)
// Should show the attachment object with dataUrl
```

### Check 3: Check localStorage
```javascript
// In browser console:
const diary = JSON.parse(localStorage.getItem('school:diary'))
console.log(diary['2025-12-22']) // Use your date
// Should show diary entries with attachments array
```

## Expected Flow

```
Teacher:
1. Select file → Upload starts
2. Upload progress → 0% to 100%
3. Upload complete → "1 file(s) uploaded"
4. File appears in list → [File  name.pdf  Download]
5. Click Publish → "Diary updated"
6. Console logs → attachments: [{...}]

Student:
1. Select date → Diary entry loads
2. See attachment → [File  name.pdf  📥 Download]
3. Console logs → Attachment: {type: 'file', dataUrl: '...'}
4. Click Download → File opens from B2
```

## Quick Test

Run this in teacher diary console BEFORE clicking Publish:
```javascript
console.log('Attachments:', attachments)
// Should NOT be empty!
```

If empty, the file didn't upload or state didn't update. Try uploading again.

## Success Criteria

✅ Teacher sees upload progress
✅ Teacher sees "X file(s) uploaded" message
✅ File appears in attachments list
✅ Publish button disabled during upload
✅ Console shows attachments array with file
✅ Student sees diary entry with file
✅ Student sees Download button
✅ Download button works and opens file

If all checkmarks pass, the feature is working correctly! 🎉
