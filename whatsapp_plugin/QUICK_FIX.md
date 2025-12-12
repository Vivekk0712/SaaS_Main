# Quick Fix: Account Not Registered Error

## The Error
```
(#133010) Account not registered
```

## The Solution (2 Minutes)

### Option 1: Register the Number (Recommended)

1. **Go to**: https://business.facebook.com/
2. **Click**: WhatsApp Manager → API Setup
3. **Find**: "To" Phone Numbers section
4. **Click**: "Add Phone Number"
5. **Enter**: `+918850623515` (or your number)
6. **Verify**: Enter code received on WhatsApp
7. **Test**: Run `.\test-attendance-alert.ps1` again

### Option 2: Use Your Own Number

1. **Open**: `test-attendance-alert.ps1`
2. **Change line 7**:
   ```powershell
   $TEST_PHONE_NUMBER = "+91YOUR_NUMBER"  # Your WhatsApp number
   ```
3. **Register** your number in Meta Business Manager (see Option 1)
4. **Test**: Run `.\test-attendance-alert.ps1`

## Why This Happens

WhatsApp Business API requires you to **register test numbers** before sending messages to them. This prevents spam during development.

## After Registration

- ✅ Messages will be delivered
- ✅ You can test all templates
- ✅ No charges for test messages
- ✅ Up to 5 test numbers allowed

## Still Having Issues?

See: `FIX_ACCOUNT_NOT_REGISTERED.md` for detailed instructions.

## Quick Links

- Meta Business Manager: https://business.facebook.com/
- WhatsApp Manager: https://business.facebook.com/wa/manage/
- Documentation: `TROUBLESHOOTING.md`
