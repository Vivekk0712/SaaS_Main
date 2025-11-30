# 🎯 Razorpay Integration Setup Guide

## ✅ Integration Complete!

The Razorpay payment gateway has been successfully integrated into the parent payments system.

---

## 🚀 Quick Start

### 1. Start the Razorpay Plugin Service

```powershell
# Navigate to the razorpay plugin folder
cd razorpay_plugin

# Install dependencies (if not done)
npm install

# Start the service
npm run dev
```

The Razorpay plugin will start on **port 5002**.

### 2. Start the Main Application

```powershell
# From the root directory
npm run dev:stack
```

This starts:
- **Main App**: `http://localhost:3000` (School ERP)
- **Study Service**: `http://localhost:3002` (Academic APIs)
- **Onboarding Service**: `http://localhost:3005` (Admissions APIs)

---

## 🔧 Configuration

### Environment Variables

The Razorpay keys are already configured in:

**`.env`:**
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_RknIwce1HcJO26
RAZORPAY_KEY_SECRET=CKU27GjhtAnxygjQHAHZLSzs
RAZORPAY_PLUGIN_URL=http://localhost:5002
```

**`apps/frontend-next/.env.local`:**
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_RknIwce1HcJO26
RAZORPAY_KEY_SECRET=CKU27GjhtAnxygjQHAHZLSzs
RAZORPAY_PLUGIN_URL=http://localhost:5002
```

**`razorpay_plugin/.env`:**
```env
RAZORPAY_KEY_ID=rzp_test_RknIwce1HcJO26
RAZORPAY_KEY_SECRET=CKU27GjhtAnxygjQHAHZLSzs
PORT=5002
```

> **Note**: These are test keys. For production, replace with your actual Razorpay keys from the [Razorpay Dashboard](https://dashboard.razorpay.com/).

---

## 🎯 How It Works

### Payment Flow:

```
1. Parent clicks "Pay Now" button
   ↓
2. Frontend calls /api/payments/create-order
   ↓
3. Main App forwards request to Razorpay Plugin (port 5002)
   ↓
4. Razorpay Plugin creates order with Razorpay API
   ↓
5. Frontend opens Razorpay checkout modal
   ↓
6. Parent completes payment (card/UPI/netbanking)
   ↓
7. Razorpay sends payment response to frontend
   ↓
8. Frontend calls /api/payments/verify
   ↓
9. Razorpay Plugin verifies payment signature
   ↓
10. System marks fee as paid in database
   ↓
11. Accountant sees updated payment status
```

### Architecture:

```
┌─────────────────┐
│  Parent Browser │
└────────┬────────┘
         │ Pay Now
         ↓
┌─────────────────┐
│   Main App      │ (Port 3000)
│   Next.js       │
└────────┬────────┘
         │ Create Order API
         ↓
┌─────────────────┐
│ Razorpay Plugin │ (Port 5002)
│   Express.js    │
└────────┬────────┘
         │ Razorpay API
         ↓
┌─────────────────┐
│ Razorpay Servers│
└────────┬────────┘
         │ Payment Gateway
         ↓
┌─────────────────┐
│  Parent Browser │
│ (Checkout Modal)│
└────────┬────────┘
         │ Payment Success
         ↓
┌─────────────────┐
│   Main App      │
│ Update Database │
└─────────────────┘
```

---

## 💳 Features

### For Parents:
- ✅ **Real Razorpay checkout** with multiple payment options
- ✅ **Secure payment processing** via Razorpay
- ✅ **Payment confirmation** and receipt
- ✅ **Real-time status updates**
- ✅ **Payment history** tracking

### For Accountants:
- ✅ **Live payment status** in dashboard
- ✅ **Automatic fee marking** when payment succeeds
- ✅ **Payment tracking** and audit trail
- ✅ **Real-time balance updates**

### Payment Methods Supported:
- 💳 Credit/Debit Cards
- 📱 UPI (Google Pay, PhonePe, Paytm, etc.)
- 🏦 Net Banking
- 💰 Wallets (Paytm, PhonePe, etc.)

---

## 🧪 Testing

### Test the Complete Flow:

#### Step 1: Login as Accountant
1. Go to `http://localhost:3000/accountant/login`
2. Login with accountant credentials
3. Navigate to Dashboard
4. Create an ad-hoc fee:
   - Click "Create Ad-hoc Fee"
   - Enter title: "Sports Day Fee"
   - Enter amount: 500
   - Select a class
   - Click "Send to Students"

#### Step 2: Login as Parent
1. Go to `http://localhost:3000/parent/login`
2. Login with parent credentials (phone number)
3. Navigate to Payments page
4. You should see the ad-hoc fee in "Additional Fees" section
5. Click "Pay Now"

#### Step 3: Complete Payment
1. Razorpay modal should open
2. Use test card details:
   - **Card Number**: `4111 1111 1111 1111`
   - **CVV**: Any 3 digits (e.g., `123`)
   - **Expiry**: Any future date (e.g., `12/25`)
   - **Name**: Any name
3. Click "Pay"
4. Payment should succeed

#### Step 4: Verify
1. Parent should see "Payment successful!" message
2. Fee status should change to "Paid" (green badge)
3. Go back to Accountant dashboard
4. The ad-hoc fee should show as "Paid" (green badge)
5. Pending amount should be ₹0

### Test Cards (Razorpay Test Mode):

| Card Number         | Result  | Description                    |
|---------------------|---------|--------------------------------|
| 4111 1111 1111 1111 | Success | Standard Visa test card        |
| 5555 5555 5555 4444 | Success | Standard Mastercard test card  |
| 4000 0000 0000 0002 | Failure | Card declined                  |
| 4000 0000 0000 0069 | Failure | Expired card                   |

**For UPI Testing:**
- Use any UPI ID format: `test@paytm`
- Payment will succeed in test mode

---

## 🔐 Security

### Payment Verification:
- ✅ **Signature verification** using Razorpay HMAC SHA256
- ✅ **Server-side validation** of all payments
- ✅ **Secure API communication** between services
- ✅ **Environment-based configuration**

### Data Protection:
- ✅ Payment details stored in Razorpay plugin database
- ✅ No sensitive card data stored locally
- ✅ PCI DSS compliant through Razorpay

---

## 📊 Database Updates

When payment succeeds:

1. **Razorpay Plugin Database** (school_erp):
   - `payment_attempts` table: Records order creation
   - `payments` table: Records successful payment
   - `refunds` table: Records any refunds

2. **Main App Database** (sas):
   - **Ad-hoc bills**: `status` updated to `'paid'`
   - **Regular installments**: Marked as paid in fee structure
   - **Accountant dashboard**: Shows updated balances
   - **Parent payments page**: Shows payment history

---

## 🚨 Troubleshooting

### Issue: Razorpay Plugin Not Starting

**Solution:**
```powershell
cd razorpay_plugin
npm install
npm run dev
```

Check if port 5002 is already in use:
```powershell
netstat -ano | findstr :5002
```

---

### Issue: Payment Modal Not Opening

**Possible Causes:**
1. Razorpay script not loaded
2. Invalid Razorpay key
3. Razorpay plugin not running

**Solution:**
1. Check browser console for errors
2. Verify `NEXT_PUBLIC_RAZORPAY_KEY_ID` in `.env.local`
3. Ensure Razorpay plugin is running on port 5002
4. Check network tab for API call failures

---

### Issue: Payment Verification Failing

**Possible Causes:**
1. Invalid signature
2. Razorpay plugin not responding
3. Network connectivity issues

**Solution:**
1. Check Razorpay plugin logs
2. Verify `RAZORPAY_KEY_SECRET` matches in all config files
3. Check network connectivity
4. Verify webhook signature in Razorpay dashboard

---

### Issue: Database Not Updating

**Possible Causes:**
1. API endpoint not responding
2. Payment success callback not triggered
3. Database connection issues

**Solution:**
1. Check API endpoints are responding:
   ```powershell
   curl http://localhost:3000/api/payments/create-order
   ```
2. Verify payment success callback in browser console
3. Check database connection in Razorpay plugin
4. Check browser network tab for errors

---

### Issue: "Failed to create order"

**Solution:**
1. Check Razorpay plugin is running:
   ```powershell
   curl http://localhost:5002/health
   ```
2. Verify Razorpay keys are correct
3. Check Razorpay plugin logs for errors
4. Ensure database connection is working

---

## 📝 API Endpoints

### Main App (Port 3000):

#### Create Order
```
POST /api/payments/create-order
Content-Type: application/json

{
  "amount": 500,
  "currency": "INR",
  "invoiceId": "INV_123",
  "idempotencyKey": "KEY_123"
}
```

#### Verify Payment
```
POST /api/payments/verify
Content-Type: application/json

{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
```

### Razorpay Plugin (Port 5002):

#### Health Check
```
GET /health
```

#### Create Order
```
POST /api/payments/create-order
```

#### Verify Payment
```
POST /api/payments/verify
```

---

## 🎉 Success Indicators

The integration is working correctly when:

1. ✅ Razorpay plugin starts without errors on port 5002
2. ✅ Main app connects to Razorpay plugin successfully
3. ✅ "Pay Now" button opens Razorpay checkout modal
4. ✅ Test payment completes successfully
5. ✅ Payment status updates in parent view
6. ✅ Payment status updates in accountant dashboard
7. ✅ Database records payment in both systems

---

## 📚 Additional Resources

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)
- [Razorpay Dashboard](https://dashboard.razorpay.com/)
- [Razorpay API Reference](https://razorpay.com/docs/api/)

---

## 🔄 Production Deployment

### Before Going Live:

1. **Get Production Keys:**
   - Login to [Razorpay Dashboard](https://dashboard.razorpay.com/)
   - Complete KYC verification
   - Get production API keys

2. **Update Environment Variables:**
   ```env
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_key_id
   RAZORPAY_KEY_SECRET=your_live_key_secret
   ```

3. **Enable Webhooks:**
   - Configure webhook URL in Razorpay dashboard
   - Set webhook secret in environment variables

4. **Test in Production:**
   - Make a small real payment
   - Verify payment flow
   - Check database updates

5. **Monitor:**
   - Set up logging and monitoring
   - Track payment success rates
   - Monitor for errors

---

## 💡 Tips

1. **Always test with test keys first** before using production keys
2. **Keep your secret keys secure** - never commit them to git
3. **Monitor Razorpay dashboard** for payment analytics
4. **Set up webhooks** for automatic payment status updates
5. **Enable auto-capture** for instant payment confirmation
6. **Use idempotency keys** to prevent duplicate orders

---

## 🎊 You're All Set!

The Razorpay integration is now complete and ready to use. Parents can make real payments through Razorpay, and the system automatically updates payment status across all dashboards!

For any issues, check the troubleshooting section or refer to the Razorpay documentation.

Happy payments! 💰✨
