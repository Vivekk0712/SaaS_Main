# Fix: Invalid Phone Number ID or Access Token

## Error Message
```
"Object with ID '909232858936055' does not exist, cannot be loaded due to missing permissions"
```

## Root Cause
Either:
1. **Access Token has expired** (temporary tokens expire in 24 hours)
2. **Phone Number ID is incorrect**
3. **Permissions are missing** on the access token

## Quick Fix: Get New Credentials

### Step 1: Go to Meta Business Manager
1. Open https://business.facebook.com/
2. Navigate to **WhatsApp** → **API Setup**

### Step 2: Get Phone Number ID
1. In the API Setup page, look for **Phone Number ID**
2. Copy the number (should be a long numeric ID)
3. Update `.env`:
   ```
   WHATSAPP_TEST_PHONE_NUMBER_ID=your_phone_number_id_here
   ```

### Step 3: Get New Access Token

#### Option A: Temporary Token (24 hours - for testing)
1. In API Setup page, find **Temporary access token**
2. Click **Generate token** or **Copy**
3. Update `.env`:
   ```
   WHATSAPP_ACCESS_TOKEN=your_new_token_here
   ```

#### Option B: Permanent Token (recommended for production)
1. Go to **System Users** in Meta Business Manager
2. Create a new system user or select existing
3. Assign **WhatsApp Business Management** permission
4. Generate a permanent token
5. Update `.env` with the permanent token

### Step 4: Restart the Server
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## Detailed Steps with Screenshots

### Getting Phone Number ID

1. **Navigate to WhatsApp Manager**:
   - Go to https://business.facebook.com/
   - Click on **WhatsApp Accounts** in the left menu
   - Select your WhatsApp Business Account

2. **Find API Setup**:
   - Click on **API Setup** in the left menu
   - You'll see a section called **Phone Number**

3. **Copy Phone Number ID**:
   - Look for **Phone number ID** (not the phone number itself)
   - It's a long number like `123456789012345`
   - Copy this entire number

### Getting Access Token

#### Temporary Token (Quick Test)

1. **In API Setup page**:
   - Scroll to **Temporary access token** section
   - Click **Generate token** button
   - Copy the token (starts with `EAA...`)

2. **Important**: 
   - Temporary tokens expire in **24 hours**
   - You'll need to regenerate daily for testing
   - Not suitable for production

#### Permanent Token (Production)

1. **Go to System Users**:
   - In Meta Business Manager, click **Business Settings**
   - Navigate to **Users** → **System Users**
   - Click **Add** to create new system user

2. **Configure System User**:
   - Name: `WhatsApp API User`
   - Role: **Admin**
   - Click **Create System User**

3. **Assign Assets**:
   - Click on the system user you just created
   - Click **Add Assets**
   - Select **Apps**
   - Choose your WhatsApp app
   - Enable **Full Control**

4. **Generate Token**:
   - Click **Generate New Token**
   - Select your app
   - Select permissions:
     - `whatsapp_business_management`
     - `whatsapp_business_messaging`
   - Click **Generate Token**
   - Copy and save the token securely

5. **Token Never Expires**:
   - This token doesn't expire
   - Keep it secure
   - Don't commit to git

## Update .env File

Open `whatsapp_plugin/.env` and update:

```env
# Replace with your actual values
WHATSAPP_TEST_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Verify Credentials

### Test with cURL

```bash
# Replace with your actual values
PHONE_NUMBER_ID="your_phone_number_id"
ACCESS_TOKEN="your_access_token"

curl -X GET "https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

**Expected Response** (if credentials are valid):
```json
{
  "verified_name": "Your Business Name",
  "display_phone_number": "+1234567890",
  "quality_rating": "GREEN",
  "id": "123456789012345"
}
```

**Error Response** (if credentials are invalid):
```json
{
  "error": {
    "message": "Object does not exist...",
    "type": "GraphMethodException",
    "code": 100
  }
}
```

## Common Issues

### Issue 1: Token Expired
**Symptom**: Worked yesterday, not working today

**Solution**: Generate new temporary token or use permanent token

### Issue 2: Wrong Phone Number ID
**Symptom**: Never worked, always get 400 error

**Solution**: 
1. Double-check the Phone Number ID in Meta
2. Make sure you're copying the ID, not the phone number
3. The ID should be all numbers, no `+` or spaces

### Issue 3: Missing Permissions
**Symptom**: Token works for some operations but not messaging

**Solution**: Regenerate token with these permissions:
- `whatsapp_business_management`
- `whatsapp_business_messaging`

### Issue 4: Wrong App
**Symptom**: Token is valid but phone number not found

**Solution**: 
1. Make sure the token is for the correct app
2. Verify the phone number is added to that app
3. Check in API Setup that everything is connected

## Security Reminder

⚠️ **Never commit your access token to git!**

The `.gitignore` file already protects `.env`, but double-check:

```bash
git status
# .env should NOT appear in the list
```

If you accidentally committed it:
1. **Immediately revoke the token** in Meta Business Manager
2. Generate a new token
3. Remove from git history

## After Updating Credentials

1. **Restart the server**:
   ```bash
   npm run dev
   ```

2. **Test with hello_world**:
   - Open http://localhost:4100
   - Select `hello_world` template
   - Select language `English US (en_US)`
   - Enter your phone number
   - Click "Send Test WhatsApp"

3. **If hello_world works**, then test `attendance_alert`:
   - Select `attendance_alert` template
   - Select language `English (en)`
   - Click "Send Test WhatsApp"

## Quick Checklist

Before testing:
- [ ] Phone Number ID is correct (from Meta API Setup)
- [ ] Access Token is fresh (generated today)
- [ ] Token has required permissions
- [ ] `.env` file is updated
- [ ] Server is restarted
- [ ] Template is approved in Meta (for attendance_alert)

## Still Not Working?

If you've updated credentials and still getting errors:

1. **Check Meta Business Manager**:
   - Is your WhatsApp Business Account active?
   - Is the phone number verified?
   - Are there any restrictions or warnings?

2. **Check Template Status**:
   - Go to Message Templates
   - Verify `attendance_alert` status is **APPROVED**
   - Check the language is `en` (English)

3. **Check Logs**:
   - Look at the terminal output
   - Check for specific error messages
   - Share the error details for help

## Need Help?

If you're still stuck:
1. Check the error message in terminal
2. Verify credentials in Meta Business Manager
3. Try with `hello_world` template first
4. Check `TROUBLESHOOTING.md` for more issues
