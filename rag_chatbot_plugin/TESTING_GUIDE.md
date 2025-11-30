# Testing Guide

## Authentication for Testing

### Development Mode (Easy)

In development mode, you can use the simple test token:

```javascript
Authorization: Bearer test-token
```

This will authenticate you as:
- User ID: 1
- Role: student
- Class ID: 10

### Testing Different Users

To test with different user roles, you can modify the auth middleware temporarily or use the web UI which uses the test token.

### Web UI Testing

1. Open `public/index.html` in your browser
2. The UI automatically uses `test-token`
3. Upload PDFs and ask questions
4. All requests will be authenticated as student ID 1

### Command Line Testing

The PowerShell scripts also use `test-token`:

```powershell
# Upload a PDF
.\test-upload.ps1 path\to\file.pdf

# Ask a question
.\test-query.ps1 "What is the main topic?"
```

## Testing Different Scenarios

### Test as Student
Default behavior - uses test-token (student ID 1, class 10)

### Test as Teacher
Modify the auth middleware temporarily:
```typescript
req.user = {
  id: 100,
  role: 'teacher',
  classId: 10
};
```

### Test as Admin
```typescript
req.user = {
  id: 999,
  role: 'admin'
};
```

## Production Authentication

In production, replace the test token logic with real JWT verification from your ERP system:

1. Remove the development mode check in `auth.middleware.ts`
2. Configure `JWT_PUBLIC_KEY` in `.env` with your ERP's public key
3. Your ERP should issue JWT tokens with this structure:
```json
{
  "id": 123,
  "role": "student",
  "classId": 10
}
```

## Testing Checklist

- [x] Upload PDF as student
- [x] Check processing status
- [x] Ask questions
- [x] Verify citations
- [ ] Test access control (different users)
- [ ] Test error scenarios
- [ ] Test with large PDFs
- [ ] Test with multiple PDFs

## Common Issues

### "jwt malformed" error
- **Fixed!** Use `test-token` in development mode
- In production, ensure JWT tokens are properly formatted

### "No token provided"
- Add `Authorization: Bearer test-token` header
- Check that the header is being sent

### "Invalid token"
- In development, use exactly `test-token`
- In production, verify JWT secret matches

## Quick Test Commands

```bash
# Test health endpoint (no auth needed)
curl http://localhost:4000/health

# Test upload with auth
curl -X POST http://localhost:4000/api/upload \
  -H "Authorization: Bearer test-token" \
  -F "file=@test.pdf"

# Test query with auth
curl -X POST http://localhost:4000/api/query \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"question":"What is this about?"}'
```

## Next Steps

Once testing is complete:
1. Remove development mode auth bypass
2. Integrate with real ERP authentication
3. Test with production JWT tokens
4. Deploy to staging environment
