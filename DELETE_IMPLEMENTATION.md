# File Delete Implementation

## Overview
Complete implementation for deleting teacher-uploaded PDFs from both Backblaze B2 storage and MySQL database.

## Components

### 1. Delete API Endpoint
**File:** `apps/frontend-next/src/app/api/storage/delete/route.ts`

**Functionality:**
- Accepts B2 key in POST request
- Deletes file from Backblaze B2 storage
- Removes record from MySQL `materials` table
- Removes record from MySQL `textbooks` table (if exists)
- Returns success/error response

**Request:**
```json
POST /api/storage/delete
{
  "b2Key": "school-erp/10/A/Mathematics/materials/1234567890_file.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "message": "File deleted from storage and database"
}
```

### 2. Backblaze Library Update
**File:** `apps/frontend-next/src/lib/backblaze.ts`

**Changes:**
- Updated `deleteFromB2()` function to return `DeleteResult` object
- Added proper error handling with error messages
- Returns `{ success: boolean, error?: string }`

### 3. Teacher UI Integration
**File:** `apps/frontend-next/src/app/teacher/academic-content/chapter/page.tsx`

**Functionality:**
- `removeAttachment()` function handles delete button click
- Checks if file is stored in B2 (not base64)
- Calls `/api/storage/delete` API
- Removes from local state after successful deletion
- Shows user feedback messages

## Delete Flow

1. **Teacher clicks "Delete" button** on an attachment
2. **UI checks** if file is stored in B2 (not legacy base64)
3. **API call** to `/api/storage/delete` with B2 key
4. **B2 deletion** - File removed from Backblaze storage
5. **MySQL deletion** - Records removed from database tables
6. **UI update** - Attachment removed from display
7. **User feedback** - Success message shown

## Database Tables Affected

### materials table
```sql
DELETE FROM materials WHERE b2_key = ?
```

### textbooks table
```sql
DELETE FROM textbooks WHERE b2_key = ?
```

## Error Handling

- Invalid B2 key → 400 Bad Request
- B2 deletion failure → 500 Internal Server Error with details
- Database errors → Logged and returned in response
- UI shows error messages to user

## Testing

Use the test script to verify deletion:
```powershell
.\test-delete-file.ps1
```

Replace the `$testB2Key` variable with an actual B2 key from your database.

## Security Considerations

- No authentication check in current implementation
- Consider adding teacher authentication
- Validate that teacher owns the file before deletion
- Add audit logging for deletions

## Future Enhancements

1. Add authentication/authorization
2. Soft delete with trash/restore functionality
3. Batch delete for multiple files
4. Delete confirmation dialog in UI
5. Audit trail for deleted files
6. Cascade delete for related records (RAG embeddings)

## Related Files

- `/api/storage/upload/route.ts` - File upload endpoint
- `/lib/uploadToBackblaze.ts` - Client-side upload helper
- `/app/teacher/academic-content/chapter/page.tsx` - Teacher UI
- `sql/schema.sql` - Database schema

## Notes

- Legacy base64 files are not deleted from B2 (they don't exist there)
- RAG embeddings are NOT automatically deleted (needs separate implementation)
- File deletion is permanent and cannot be undone
