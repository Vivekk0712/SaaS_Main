# Teacher PDF Upload Flow - Complete Architecture

## Overview
When a teacher uploads a PDF in the chapter page, the file goes through multiple systems for storage, database tracking, and AI processing.

## Complete Upload Flow

### 1. Teacher UI Upload
**File:** `apps/frontend-next/src/app/teacher/academic-content/chapter/page.tsx`

```typescript
addFiles(subId, files) → uploadFileToB2(file, metadata, progressCallback)
```

- Teacher selects PDF file
- UI calls `uploadFileToB2` from client-side helper
- Shows upload progress to teacher

### 2. Client-Side Upload Helper
**File:** `apps/frontend-next/src/lib/uploadToBackblaze.ts`

```typescript
uploadFileToB2() → POST /api/storage/upload
```

- Converts file to FormData
- Sends to upload API endpoint
- Returns B2 key and metadata

### 3. Storage Upload API
**File:** `apps/frontend-next/src/app/api/storage/upload/route.ts`

**Actions:**
1. **Upload to B2 Storage**
   - Calls `uploadToB2()` from backblaze library
   - Stores file in Backblaze B2 cloud
   - Generates unique B2 key

2. **Send to RAG Plugin** (for PDFs only)
   - Creates FormData with PDF and metadata
   - POSTs to `http://localhost:4000/api/upload`
   - Includes: class, section, subject, chapterId, b2Key

**Returns:**
```json
{
  "success": true,
  "b2Key": "school-erp/CLASS 1/A/PHY/materials/1766339157315_surface_tension.pdf",
  "b2Path": "https://...",
  "fileSize": 123456,
  "ragProcessed": true
}
```

### 4. RAG Plugin Processing
**File:** `rag_chatbot_plugin/src/controllers/upload.controller.ts`

**Actions:**
1. Extract text from PDF (6 pages)
2. Split into chunks (7 chunks)
3. Generate embeddings for each chunk
4. Store vectors in Qdrant with metadata:
   ```json
   {
     "klass": "CLASS 1",
     "section": "A",
     "subject": "PHY",
     "chapterId": "1765549285417-0",
     "b2Key": "school-erp/...",
     "filename": "surface_tension.pdf"
   }
   ```

### 5. MySQL Database Save
**File:** `apps/frontend-next/src/app/api/mysql/academics/materials/route.ts`

**Called by:** `addSubtopicMaterial()` from teacher UI

**Actions:**
- Detects if dataUrl is B2 key (doesn't start with 'data:')
- Saves to `materials` table with B2 columns:
  ```sql
  INSERT INTO materials (
    class_id, section_id, subject_id, 
    chapter_id, subtopic_id, 
    type, name, mime, 
    b2_key  -- NEW: B2 storage key
  ) VALUES (...)
  ```

### 6. UI Update
**File:** `apps/frontend-next/src/app/teacher/academic-content/chapter/page.tsx`

- Adds attachment to local state
- Shows success message
- File appears in attachments list

## Data Storage Locations

### 1. Backblaze B2 (Cloud Storage)
- **Location:** `school-erp/{class}/{section}/{subject}/materials/{timestamp}_{filename}`
- **Purpose:** Actual PDF file storage
- **Access:** Via signed URLs (1 hour expiry)

### 2. Qdrant (Vector Database)
- **Collection:** `teacher_materials`
- **Purpose:** AI-powered search and retrieval
- **Content:** Text chunks + embeddings + metadata

### 3. MySQL (Relational Database)
- **Table:** `materials`
- **Purpose:** File metadata and relationships
- **Columns:**
  - `b2_key` - Reference to B2 file
  - `class_id`, `section_id`, `subject_id` - Relationships
  - `chapter_id`, `subtopic_id` - Content organization
  - `name`, `mime`, `type` - File metadata

### 4. localStorage (Browser Cache)
- **Key:** `school:syllabus:{class}|{section}|{subject}`
- **Purpose:** Offline access and quick loading
- **Content:** Chapter structure with attachment references

## Delete Flow

When teacher deletes a PDF:

1. **UI** → `/api/storage/delete` with B2 key
2. **Delete API** → Removes from B2 storage
3. **Delete API** → Removes from MySQL database
4. **UI** → Updates local state
5. **⚠️ Manual:** RAG embeddings need separate cleanup

## Current Issue (FIXED)

### Problem
MySQL save was failing with 500 error because the API didn't handle B2 keys properly.

### Solution
Updated `/api/mysql/academics/materials` POST endpoint to:
- Detect B2 keys (don't start with 'data:')
- Save B2 key to `b2_key` column
- Save base64 to `data_url` column (for legacy files)
- Added error logging for debugging

## Testing the Flow

### Upload Test
1. Go to teacher chapter page
2. Upload a PDF file
3. Check logs for:
   - ✅ B2 upload success
   - ✅ RAG processing (6 pages, 7 chunks)
   - ✅ MySQL save success (no 500 error)
   - ✅ UI shows attachment

### Delete Test
1. Click delete on uploaded PDF
2. Check logs for:
   - ✅ B2 deletion success
   - ✅ MySQL deletion success
   - ✅ UI removes attachment

## Environment Variables Required

```env
# Backblaze B2
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_REGION=us-west-004
B2_BUCKET_NAME=your-bucket
B2_KEY_ID=your-key-id
B2_APPLICATION_KEY=your-app-key

# RAG Plugin
RAG_PLUGIN_URL=http://localhost:4000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=school_management
```

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/storage/upload` | POST | Upload file to B2 + RAG |
| `/api/storage/delete` | POST | Delete from B2 + MySQL |
| `/api/mysql/academics/materials` | POST | Save metadata to MySQL |
| `/api/mysql/academics/materials` | GET | Fetch materials list |
| `http://localhost:4000/api/upload` | POST | RAG processing |

## Next Steps

1. ✅ Fix MySQL save (DONE)
2. ⚠️ Add RAG deletion when file is deleted
3. ⚠️ Add authentication to delete endpoint
4. ⚠️ Add file size validation
5. ⚠️ Add duplicate file detection
6. ⚠️ Add batch upload support
