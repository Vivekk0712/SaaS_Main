# Assignment Attachment Delete Feature

## Problem
When teachers update/replace assignments, old PDF files remain in B2 storage permanently, causing:
- Wasted storage space
- Increased storage costs
- Orphaned files that can't be accessed
- No way to clean up old attachments

## Solution
Added delete functionality to teacher assignments page:
- Display all attachments in assignment detail view
- Delete button for each attachment
- Removes file from B2 storage
- Updates assignment in localStorage
- Refreshes assignment list

## Changes Made

### 1. Teacher Assignments Page
**File:** `apps/frontend-next/src/app/teacher/assignments/page.tsx`

#### Added Components
- `FileDownloadButton` - Download attachments with B2 signed URLs
- Attachments display section with delete buttons

#### New Features
1. **Attachments Display**
   - Shows all files and links attached to assignment
   - Download button for files
   - Open button for links
   - Delete button (🗑️) for each attachment

2. **Delete Function**
   ```typescript
   deleteAttachment(index) {
     1. Confirm deletion
     2. Delete from B2 storage (if B2 file)
     3. Remove from attachments array
     4. Update assignment in localStorage
     5. Refresh assignments list
   }
   ```

3. **Visual Indicators**
   - 📄 File icon
   - 🔗 Link icon
   - 📥 Download button
   - 🗑️ Delete button (red color)
   - ⏳ Loading state during deletion

## User Flow

### Teacher Deletes Attachment

1. **Go to Assignments Page**
   ```
   /teacher/assignments
   ```

2. **Click on Assignment**
   - See assignment details
   - See attachments section

3. **View Attachments**
   ```
   📎 Attachments
   ┌────────────────────────────────────────┐
   │ 📄 homework.pdf  [📥] [🗑️]             │
   │ 🔗 https://...   [Open] [🗑️]           │
   └────────────────────────────────────────┘
   ```

4. **Click Delete (🗑️)**
   - Confirmation dialog appears
   - Click OK to confirm

5. **File Deleted**
   - Removed from B2 storage
   - Removed from assignment
   - Success message shown
   - Attachment disappears from list

## What Gets Deleted

### B2 Files
- File deleted from Backblaze B2 bucket
- Frees up storage space
- Reduces storage costs

### Links
- Only removed from assignment
- No external deletion (just a URL)

### localStorage
- Attachment removed from assignment object
- Assignment updated in all class/section combinations

## Benefits

### 1. Storage Management
✅ Delete old/replaced files
✅ Free up B2 storage space
✅ Reduce storage costs
✅ Keep bucket clean

### 2. Assignment Management
✅ Remove incorrect files
✅ Update attachments easily
✅ Clean up old assignments
✅ Better organization

### 3. User Experience
✅ Simple one-click delete
✅ Confirmation dialog prevents accidents
✅ Visual feedback during deletion
✅ Immediate UI update

## Safety Features

### 1. Confirmation Dialog
```javascript
if (!confirm(`Delete ${attachment.name}?`)) return
```
Prevents accidental deletions.

### 2. Error Handling
```javascript
try {
  // Delete from B2
  // Update assignment
} catch (error) {
  console.error('Delete error:', error)
  setMessage('Failed to delete attachment.')
}
```

### 3. Loading State
```javascript
setDeletingAttachment(true)
// Disables all delete buttons during operation
```

### 4. B2 Deletion Check
```javascript
// Only delete from B2 if it's a B2 file
if (!attachment.dataUrl.startsWith('data:')) {
  await fetch('/api/storage/delete', ...)
}
```

## API Used

### DELETE Endpoint
```
POST /api/storage/delete
Body: { b2Key: "school-erp/..." }
```

This endpoint:
1. Deletes file from B2 storage
2. Removes from MySQL database
3. Returns success/error response

## Edge Cases Handled

### 1. Legacy Base64 Files
- Detected by `dataUrl.startsWith('data:')`
- Not deleted from B2 (they're not there)
- Only removed from assignment

### 2. Missing Files
- B2 delete may fail if file already deleted
- Error logged but doesn't block UI update
- Assignment still updated

### 3. Multiple Class/Sections
- Same assignment may exist for multiple classes
- Delete only affects current class/section
- Other classes keep their attachments

### 4. Network Errors
- Caught and logged
- User sees error message
- Can retry deletion

## Testing

### Test Delete Flow

1. **Create Assignment with File**
   - Go to `/teacher/diary`
   - Upload PDF file
   - Publish assignment

2. **Open Assignment**
   - Go to `/teacher/assignments`
   - Click on the assignment
   - See attachments section

3. **Delete Attachment**
   - Click 🗑️ button
   - Confirm deletion
   - See "Deleting file..." message
   - See "Attachment deleted successfully."

4. **Verify Deletion**
   - Attachment removed from list
   - File deleted from B2 bucket
   - Assignment updated in localStorage

### Test B2 Deletion

1. **Check B2 Before**
   - Login to Backblaze console
   - Find file in bucket
   - Note the file path

2. **Delete from UI**
   - Click delete button
   - Confirm

3. **Check B2 After**
   - Refresh bucket view
   - File should be gone
   - Storage space freed

## Limitations

### 1. RAG Embeddings
⚠️ Deleting file doesn't remove RAG embeddings from Qdrant
- Embeddings remain in vector database
- Need separate cleanup (future enhancement)

### 2. localStorage Only
⚠️ Assignments stored in localStorage, not MySQL
- Delete only affects browser storage
- Other teachers/devices won't see deletion
- Need MySQL migration (future enhancement)

### 3. No Undo
⚠️ Deletion is permanent
- No trash/recycle bin
- No restore functionality
- Confirmation dialog is only safety net

## Future Enhancements

1. ⚠️ Add RAG embedding cleanup when file deleted
2. ⚠️ Move assignments to MySQL database
3. ⚠️ Add trash/restore functionality
4. ⚠️ Add bulk delete for multiple attachments
5. ⚠️ Add file replacement (delete + upload)
6. ⚠️ Add audit log for deletions
7. ⚠️ Add storage usage dashboard

## Related Files

- `/app/teacher/assignments/page.tsx` - Assignments UI with delete
- `/app/teacher/diary/page.tsx` - Create assignments
- `/api/storage/delete/route.ts` - Delete API
- `/lib/backblaze.ts` - B2 client

## Summary

✅ **Teachers can now delete** assignment attachments
✅ **Files removed from B2** storage
✅ **Storage costs reduced** by cleaning up old files
✅ **Simple UI** with one-click delete
✅ **Safe** with confirmation dialog
✅ **Immediate feedback** with loading states

The assignment management is now complete with proper cleanup! 🎉
