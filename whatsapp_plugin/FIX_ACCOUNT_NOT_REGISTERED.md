# Fix: WhatsApp Account Not Registered Error

## Error Message
```
(#133010) Account not registered
```

## What This Means

The phone number you're trying to send a message to (`+918850623515`) is **not registered** as a test recipient in your WhatsApp Business Account.

## Why This Happens

WhatsApp Business API has restrictions:
- In **Test/Development mode**, you can only send messages to **registered test numbers**
- You must add phone numbers to your WhatsApp Business Account before sending messages
- This is a security feature to prevent spam during testing

## How to Fix

### Step 1: Add Test Phone Number in Meta Business Manager

1. Go to: https://business.facebook.com/
2. Navigate to: **WhatsApp Manager** → **API Setup**
3. Find the section: **"To" Phone Numbers** or **"Test Phone Numbers"**
4. Click **"Add Phone Number"**
5. Enter: `+918850623515`
6. Verify the number (you'll receive a verification code via WhatsApp)
7. Enter the verification code

### Step 2: Verify the Number

1. The phone number must have WhatsApp installed
2. You'll receive a 6-digit verification code on WhatsApp
3. Enter the code in Meta Business Manager
4. The number will be added to your test recipients list

### Step 3: Test Again

Once the number is registered, run:
```powershell
.\test-attendance-alert.ps1
```

It should work now!

## Alternative: Use a Different Number

If you can't register `+918850623515`, you can:

1. **Use your own number** (if it has WhatsApp)
2. **Add it to Meta Business Manager** as a test number
3. **Update the test script** to use your number

### Update Test Script

Edit `test-attendance-alert.ps1`:
```powershell
$body = @{
    to = "+91YOUR_NUMBER_HERE"  # Change this
    # ... rest of the code
}
```

## Check Registered Numbers

To see which numbers are already registered:

1. Go to Meta Business Manager
2. WhatsApp Manager → API Setup
3. Look for **"To" Phone Numbers** section
4. You'll see a list of registered test numbers

## Important Notes

### Test Mode Limitations
- ✅ Can send to registered test numbers only
- ❌ Cannot send to random numbers
- ✅ Up to 5 test numbers can be registered
- ✅ Free to send messages to test numbers

### Production Mode
Once you go live (after Business Verification):
- ✅ Can send to any WhatsApp number
- ✅ No registration required
- ⚠️ Charges apply per message

## Quick Fix Checklist

- [ ] Go to Meta Business Manager
- [ ] Navigate to WhatsApp Manager → API Setup
- [ ] Find "To" Phone Numbers section
- [ ] Click "Add Phone Number"
- [ ] Enter: `+918850623515`
- [ ] Verify with code received on WhatsApp
- [ ] Test again with `.\test-attendance-alert.ps1`

## Still Not Working?

If the error persists after registering:

1. **Wait 5 minutes** - Registration can take a few minutes to propagate
2. **Check the number format** - Must include country code: `+918850623515`
3. **Verify WhatsApp is installed** - The number must have an active WhatsApp account
4. **Check Business Verification** - Your Meta Business Account must be verified

## Error Code Reference

| Error Code | Meaning | Solution |
|------------|---------|----------|
| 133010 | Account not registered | Add number to test recipients |
| 131026 | Message undeliverable | Check if number has WhatsApp |
| 131047 | Re-engagement message | User needs to message you first |
| 131053 | Rate limit exceeded | Wait before sending more |

## Need Help?

Check these files:
- `TROUBLESHOOTING.md` - Common WhatsApp issues
- `QUICK_START.md` - Setup guide
- `README.md` - Full documentation

## Summary

**The Fix**: Add `+918850623515` to your WhatsApp Business Account's test numbers in Meta Business Manager, verify it, then test again.

This is a normal requirement for WhatsApp Business API testing!
