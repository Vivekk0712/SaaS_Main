# 📦 Backblaze B2 Storage Implementation

**Replace localStorage base64 storage with Backblaze B2 cloud storage**

---

## 🎯 Goal

Migrate academic content (textbooks, materials, PDFs) from localStorage/base64 to Backblaze B2 storage for:
- Better performance (no large base64 strings)
- Scalability (10GB free storage)
- Professional architecture
- RAG integration ready

---

## 🔑 Your Backblaze Credentials

```env
B2_KEY_ID=00552bf3f4b2ac50000000001
B2_KEY_NAME=rag-backend-dev
B2_APPLICATION_KEY=[your_application_key]
B2_BUCKET_NAME=[your_bucket_name]
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_REGION=us-west-004
```

---

## 📁 What Will Be Implemented

### 1. Backblaze Service (`lib/backblaze.ts`)
- S3-compatible client
- Upload files
- Generate signed URLs
- Delete files

### 2. API Routes
- `POST /api/storage/upload` - Upload file to B2
- `GET /api/storage/[key]` - Get signed URL for file
- `DELETE /api/storage/[key]` - Delete file from B2

### 3. Database Changes
- Update `materials` table: Replace `data_url` with `b2_key`
- Update `textbooks` table: Replace `data_url` with `b2_key`
- Add `file_size` and `b2_path` columns

### 4. UI Updates
- Update academic content page to upload to B2
- Show upload progress
- Display files from B2 signed URLs

---

## 🗂️ B2 Bucket Structure

```
/school-erp/
  /class-1/
    /section-a/
      /mathematics/
        /textbooks/
          chapter1_1234567890.pdf
        /materials/
          notes_1234567890.pdf
      /science/
  /class-2/
```

---

## 📊 Database Schema Updates

```sql
-- Add B2 columns to materials table
ALTER TABLE materials 
ADD COLUMN b2_key VARCHAR(500),
ADD COLUMN file_size INT,
ADD COLUMN b2_path VARCHAR(1000);

-- Add B2 columns to textbooks table  
ALTER TABLE textbooks
ADD COLUMN b2_key VARCHAR(500),
ADD COLUMN file_size INT,
ADD COLUMN b2_path VARCHAR(1000);
```

---

## 🚀 Setup Instructions

### 1. Install AWS SDK
```bash
cd apps/frontend-next
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 2. Configure Environment Variables
Edit `apps/frontend-next/.env.local` and add your Backblaze credentials:
```env
B2_KEY_ID=00552bf3f4b2ac50000000001
B2_KEY_NAME=rag-backend-dev
B2_APPLICATION_KEY=YOUR_APPLICATION_KEY_HERE  # ← Add your key
B2_BUCKET_NAME=YOUR_BUCKET_NAME_HERE          # ← Add your bucket name
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_REGION=us-west-004
```

### 3. Run Database Migration

**Option A: If you already have the database set up**
```bash
mysql -u sas_app -p sas < sql/backblaze-migration.sql
```

**Option B: If setting up fresh database**
```bash
# The main schema.sql already includes B2 columns
mysql -u sas_app -p sas < sql/schema.sql
```

**Note:** The main `sql/schema.sql` file has been updated to include Backblaze B2 columns by default. The `sql/backblaze-migration.sql` file is only needed for existing databases.

### 4. Test Upload
```bash
# Start the app
npm run dev:stack

# Navigate to Teacher → Academic Content
# Try uploading a PDF file
```

---

## 📝 Files Created

1. **`apps/frontend-next/src/lib/backblaze.ts`** - Backblaze service library
2. **`apps/frontend-next/src/app/api/storage/upload/route.ts`** - Upload API
3. **`apps/frontend-next/src/app/api/storage/[key]/route.ts`** - Signed URL API
4. **`sql/backblaze-migration.sql`** - Database migration
5. **`BACKBLAZE_IMPLEMENTATION.md`** - This documentation

---

## 🧪 Testing

### Test Upload API
```bash
curl -X POST http://localhost:3000/api/storage/upload \
  -F "file=@test.pdf" \
  -F "klass=Class 10" \
  -F "section=A" \
  -F "subject=Mathematics" \
  -F "type=textbook"
```

### Expected Response
```json
{
  "success": true,
  "b2Key": "school-erp/Class 10/A/Mathematics/textbooks/1234567890_test.pdf",
  "b2Path": "https://s3.us-west-004.backblazeb2.com/your-bucket/...",
  "fileSize": 123456,
  "filename": "test.pdf",
  "message": "File uploaded successfully"
}
```

---

## 🔄 Implementation Status

1. ✅ **Backblaze Service** - Created S3-compatible client
2. ✅ **Upload API** - File upload endpoint with progress
3. ✅ **Signed URL API** - Secure file access
4. ✅ **Database Migration** - B2 columns added
5. ✅ **Upload Helper** - Client-side upload with progress tracking
6. ✅ **Teacher UI Updated** - Uses Backblaze instead of base64
7. ✅ **File Display Updated** - Fetches signed URLs for downloads
8. ✅ **File Size Validation** - 50MB limit enforced
9. ✅ **Upload Progress** - Real-time progress indicator

---

## 📝 What Changed

### Before (Base64 Storage)
- Files converted to base64 strings
- Stored in localStorage and database
- Large files caused performance issues
- No scalability

### After (Backblaze B2)
- Files uploaded to cloud storage
- Only B2 keys stored in database
- Signed URLs for secure access
- Scalable and performant
- Upload progress tracking

---

## 🧪 Testing the Implementation

### 1. Install Dependencies
```bash
cd apps/frontend-next
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 2. Configure Credentials
Edit `apps/frontend-next/.env.local`:
```env
B2_APPLICATION_KEY=YOUR_ACTUAL_KEY
B2_BUCKET_NAME=YOUR_BUCKET_NAME
```

### 3. Run Migration
```bash
mysql -u sas_app -p sas < sql/backblaze-migration.sql
```

### 4. Test Upload
1. Start app: `npm run dev:stack`
2. Login as teacher
3. Go to: Teacher → Academic Content
4. Select class, section, subject
5. Click on a chapter
6. Upload a PDF file
7. Watch upload progress
8. Click "Download" to test signed URL

---

## ✅ Features Implemented

- ✅ Cloud storage with Backblaze B2
- ✅ S3-compatible API integration
- ✅ File upload with progress tracking
- ✅ Signed URLs for secure access (1-hour expiry)
- ✅ File size validation (50MB max)
- ✅ Automatic content-type detection
- ✅ Organized folder structure in B2
- ✅ Backward compatibility (handles old base64 files)
- ✅ Error handling and user feedback
- ✅ Database schema updated

---

## 📊 File Organization in B2

```
your-bucket/
└── school-erp/
    ├── Class 10/
    │   ├── A/
    │   │   ├── Mathematics/
    │   │   │   ├── materials/
    │   │   │   │   └── 1734024000000_notes.pdf
    │   │   │   └── textbooks/
    │   │   │       └── 1734024000000_chapter1.pdf
    │   │   └── Science/
    │   └── B/
    └── Class 9/
```

---

## 🎉 Complete!

The Backblaze B2 storage integration is fully implemented and ready to use. Teachers can now upload files to cloud storage with real-time progress tracking, and files are accessed via secure signed URLs.

**Next:** Add your Backblaze credentials and test the upload flow!
