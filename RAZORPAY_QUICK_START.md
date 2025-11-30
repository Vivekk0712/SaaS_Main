# 🚀 Razorpay Integration - Quick Start

## Start Services (2 Terminals)

### Terminal 1: Razorpay Plugin
```powershell
cd razorpay_plugin
npm run dev
```
✅ Should start on **port 5002**

### Terminal 2: Main App
```powershell
npm run dev:stack
```
✅ Should start on **port 3000**

---

## Test Payment (3 Steps)

### 1️⃣ Create Fee (Accountant)
- Go to: `http://localhost:3000/accountant/login`
- Login → Dashboard → Create Ad-hoc Fee
- Title: "Test Fee" | Amount: 500 | Select Class → Send

### 2️⃣ Pay Fee (Parent)
- Go to: `http://localhost:3000/parent/login`
- Login → Payments → Click "Pay Now"
- Razorpay modal opens

### 3️⃣ Complete Payment
- **Card**: `4111 1111 1111 1111`
- **CVV**: `123`
- **Expiry**: `12/25`
- Click "Pay" → Success! ✅

---

## Verify Integration

### Run Test Script:
```powershell
.\test-razorpay-integration.ps1
```

### Manual Checks:
- ✅ Razorpay plugin health: `http://localhost:5002/health`
- ✅ Parent sees "Payment successful!"
- ✅ Fee status changes to "Paid" (green)
- ✅ Accountant dashboard shows paid status

---

## Configuration Files

### Razorpay Keys (Already Configured):
- `.env`
- `apps/frontend-next/.env.local`
- `razorpay_plugin/.env`

**Test Keys**:
- Key ID: `rzp_test_RknIwce1HcJO26`
- Key Secret: `CKU27GjhtAnxygjQHAHZLSzs`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Modal not opening | Check Razorpay plugin is running on 5002 |
| Payment fails | Use test card: 4111 1111 1111 1111 |
| Status not updating | Check both services are running |
| Plugin won't start | Run `npm install` in razorpay_plugin |

---

## Test Cards

| Card | Result |
|------|--------|
| 4111 1111 1111 1111 | ✅ Success |
| 5555 5555 5555 4444 | ✅ Success |
| 4000 0000 0000 0002 | ❌ Failure |

---

## Payment Methods Supported

- 💳 Credit/Debit Cards
- 📱 UPI (Google Pay, PhonePe, etc.)
- 🏦 Net Banking
- 💰 Wallets

---

## Architecture

```
Parent Browser
    ↓ Pay Now
Main App (3000)
    ↓ Create Order
Razorpay Plugin (5002)
    ↓ Razorpay API
Razorpay Servers
    ↓ Payment Gateway
Parent Browser (Checkout)
    ↓ Payment Success
Main App → Database Updated ✅
```

---

## Key Files

### API Routes:
- `apps/frontend-next/src/app/api/payments/create-order/route.ts`
- `apps/frontend-next/src/app/api/payments/verify/route.ts`

### Frontend:
- `apps/frontend-next/src/app/parent/payments/page.tsx`

### Plugin:
- `razorpay_plugin/src/index.ts`
- `razorpay_plugin/src/routes/payment.routes.ts`
- `razorpay_plugin/src/services/razorpay.service.ts`

---

## Documentation

📖 **Full Guide**: `RAZORPAY_SETUP_GUIDE.md`
📋 **Summary**: `RAZORPAY_INTEGRATION_SUMMARY.md`
🧪 **Test Script**: `test-razorpay-integration.ps1`

---

## Status: ✅ Ready to Use!

The integration is complete. Start both services and test the payment flow!

**Need Help?** Check `RAZORPAY_SETUP_GUIDE.md` for detailed instructions.
