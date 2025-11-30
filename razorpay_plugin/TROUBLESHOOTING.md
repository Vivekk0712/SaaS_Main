# Razorpay Plugin - Troubleshooting Guide

## Common Issues and Solutions

### 1. "International cards are not supported"

**Issue**: When testing with card `4111 1111 1111 1111`, you get an error about international cards.

**Cause**: Razorpay test mode requires Indian test cards or UPI for testing.

**Solution**: Use one of these methods:

#### Option A: Use Indian Test Cards
```
Card Number: 5267 3181 8797 5449
CVV: Any 3 digits (e.g., 123)
Expiry: Any future date (e.g., 12/25)
Name: Any name
```

#### Option B: Use UPI (Recommended for Testing)
1. Click "Pay Now with Razorpay"
2. In the Razorpay checkout, select **UPI** tab
3. Enter test UPI ID: `success@razorpay`
4. Click Pay
5. Payment will succeed automatically

#### Option C: Use Netbanking
1. Select **Netbanking** in Razorpay checkout
2. Choose any bank
3. Use test credentials provided by Razorpay

### Test UPI IDs

| UPI ID | Result |
|--------|--------|
| `success@razorpay` | Payment succeeds |
| `failure@razorpay` | Payment fails |

### Test Cards (Indian)

| Card Number | Type | Network | Result |
|-------------|------|---------|--------|
| 5267 3181 8797 5449 | Debit | Mastercard | Success |
| 4111 1111 1111 1111 | Credit | Visa | International (blocked in test) |

---

## 2. Database Connection Error

**Error**: `Database connection failed`

**Solutions**:
```bash
# Check if MySQL is running
mysql --version

# Test connection
mysql -u root -p

# Create database if missing
CREATE DATABASE IF NOT EXISTS school_erp;

# Run schema
USE school_erp;
SOURCE sql/schema.sql;
```

**Check `.env` credentials**:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_password
DB_NAME=school_erp
```

---

## 3. "Invalid signature" Error

**Issue**: Payment verification fails with invalid signature.

**Causes**:
- Wrong `RAZORPAY_KEY_SECRET` in `.env`
- Mismatch between test/production keys
- Order ID or Payment ID mismatch

**Solution**:
1. Verify keys in Razorpay Dashboard:
   - Go to https://dashboard.razorpay.com/app/keys
   - Copy **Test Key ID** and **Test Key Secret**
   - Update `.env` file

2. Ensure you're using test mode:
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxx
   ```

---

## 4. Webhook Not Receiving Events

**Issue**: Webhooks are not being triggered.

**For Local Development**:

1. Install ngrok:
   ```bash
   # Download from https://ngrok.com/download
   ngrok http 5002
   ```

2. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

3. Configure in Razorpay Dashboard:
   - Go to Settings → Webhooks
   - Add webhook URL: `https://abc123.ngrok.io/api/webhooks/razorpay`
   - Select events:
     - ✓ payment.captured
     - ✓ payment.failed
     - ✓ refund.processed
     - ✓ refund.failed
   - Copy the webhook secret
   - Update `.env`:
     ```env
     RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
     ```

**For Production**:
- Use your actual domain with HTTPS
- Example: `https://erp.yourschool.com/api/webhooks/razorpay`

---

## 5. Port Already in Use

**Error**: `EADDRINUSE: address already in use :::5002`

**Solution**:

Option A - Kill the process:
```powershell
# Find process using port 5002
netstat -ano | findstr :5002

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

Option B - Change port:
```env
# In .env file
PORT=5003
```

---

## 6. Order Created but Payment Modal Doesn't Open

**Issue**: Order is created successfully but Razorpay checkout doesn't open.

**Causes**:
- Razorpay Checkout script not loaded
- Browser blocking popups
- JavaScript errors

**Solutions**:

1. Check browser console for errors (F12)

2. Verify Razorpay script is loaded:
   ```html
   <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
   ```

3. Allow popups for localhost:
   - Chrome: Click popup icon in address bar
   - Edge: Settings → Cookies and site permissions → Pop-ups and redirects

4. Clear browser cache and reload

---

## 7. Payment Succeeds but Not Recorded in Database

**Issue**: Payment completes in Razorpay but database shows no record.

**Debugging Steps**:

1. Check logs in terminal for errors

2. Verify payment in database:
   ```sql
   USE school_erp;
   SELECT * FROM payment_attempts ORDER BY created_at DESC LIMIT 5;
   SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;
   ```

3. Check webhook events:
   ```sql
   SELECT * FROM webhook_events ORDER BY received_at DESC LIMIT 5;
   ```

4. Manually verify payment:
   ```bash
   curl http://localhost:5002/api/payments/pay_xxxxx
   ```

---

## 8. Refund Creation Fails

**Issue**: Cannot create refund.

**Common Causes**:
- Payment not captured yet
- Insufficient balance in test account
- Invalid payment ID

**Solution**:

1. Verify payment is captured:
   ```sql
   SELECT status FROM payments WHERE razorpay_payment_id = 'pay_xxxxx';
   ```

2. Check Razorpay dashboard for payment status

3. Ensure payment is at least 1 hour old (Razorpay requirement)

4. For instant refunds in test mode, use test payments

---

## 9. Environment Variables Not Loading

**Issue**: Application can't find environment variables.

**Solution**:

1. Ensure `.env` file exists in `razorpay_plugin/` directory

2. Check file name is exactly `.env` (not `.env.txt`)

3. Restart the server after changing `.env`:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

4. Verify variables are loaded:
   ```typescript
   console.log('Key ID:', process.env.RAZORPAY_KEY_ID);
   ```

---

## 10. TypeScript Compilation Errors

**Issue**: Build fails with TypeScript errors.

**Solution**:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Clean and rebuild:
   ```bash
   rm -rf dist node_modules
   npm install
   npm run build
   ```

3. Check Node version:
   ```bash
   node --version  # Should be >= 20
   ```

---

## Testing Checklist

Use this checklist to verify everything works:

- [ ] Server starts without errors
- [ ] Can access `http://localhost:5002`
- [ ] Database connection successful
- [ ] Order creation works (check logs)
- [ ] Razorpay checkout opens
- [ ] Payment with UPI `success@razorpay` succeeds
- [ ] Payment recorded in `payments` table
- [ ] Webhook events logged (if configured)
- [ ] Can view payment details via API

---

## Debug Mode

Enable detailed logging:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

Then check logs for detailed information about:
- API requests/responses
- Database queries
- Razorpay API calls
- Signature verification

---

## Getting Help

1. **Check Logs**: Terminal output shows detailed error messages
2. **Database Logs**: Query `webhook_events` table for webhook errors
3. **Razorpay Dashboard**: Check payment status and webhook logs
4. **Browser Console**: F12 to see JavaScript errors

---

## Quick Test Commands

```bash
# Test health endpoint
curl http://localhost:5002/health

# Test order creation
curl -X POST http://localhost:5002/api/payments/create-order \
  -H "Content-Type: application/json" \
  -d "{\"invoiceId\": 1001, \"amount\": 10}"

# Check database
mysql -u root -p school_erp -e "SELECT * FROM payment_attempts ORDER BY created_at DESC LIMIT 5;"

# View logs with grep
npm run dev 2>&1 | grep -i error
```

---

## Production Checklist

Before going live:

- [ ] Use production Razorpay keys
- [ ] Set `NODE_ENV=production`
- [ ] Configure HTTPS webhook endpoint
- [ ] Set up database backups
- [ ] Configure monitoring/alerts
- [ ] Test with real payment methods
- [ ] Set up proper error tracking
- [ ] Review security settings
- [ ] Test refund flow
- [ ] Document runbook for operations team

---

## Support Resources

- **Razorpay Docs**: https://razorpay.com/docs/
- **Test Cards**: https://razorpay.com/docs/payments/payments/test-card-details/
- **Webhook Guide**: https://razorpay.com/docs/webhooks/
- **API Reference**: https://razorpay.com/docs/api/
