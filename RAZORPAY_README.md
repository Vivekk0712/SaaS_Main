# 💳 Razorpay Payment Integration

## Overview

This project integrates Razorpay payment gateway into the School SAS system, enabling parents to pay fees online using multiple payment methods (cards, UPI, net banking, wallets).

---

## 🚀 Quick Start

### 1. Start Services

```powershell
# Terminal 1: Start Razorpay Plugin
cd razorpay_plugin
npm run dev

# Terminal 2: Start Main App
npm run dev:stack
```

### 2. Test Payment

1. Login as parent: `http://localhost:3000/parent/login`
2. Go to Payments page
3. Click "Pay Now" on any pending fee
4. Use test card: `4111 1111 1111 1111`
5. Complete payment

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [RAZORPAY_QUICK_START.md](RAZORPAY_QUICK_START.md) | Quick reference guide |
| [RAZORPAY_SETUP_GUIDE.md](RAZORPAY_SETUP_GUIDE.md) | Complete setup instructions |
| [RAZORPAY_INTEGRATION_SUMMARY.md](RAZORPAY_INTEGRATION_SUMMARY.md) | Technical summary |
| [RAZORPAY_FLOW_DIAGRAM.md](RAZORPAY_FLOW_DIAGRAM.md) | Visual flow diagrams |
| [RAZORPAY_CHECKLIST.md](RAZORPAY_CHECKLIST.md) | Implementation checklist |

---

## 🏗️ Architecture

```
Parent Browser
    ↓
Main App (Next.js - Port 3000)
    ↓
Razorpay Plugin (Express - Port 5002)
    ↓
Razorpay API
    ↓
Payment Gateway
```

---

## 💡 Features

### For Parents
- ✅ Multiple payment methods (Card, UPI, Net Banking, Wallets)
- ✅ Secure Razorpay checkout
- ✅ Real-time payment status
- ✅ Payment history

### For Accountants
- ✅ Real-time payment tracking
- ✅ Automatic status updates
- ✅ Payment audit trail

---

## 🔧 Configuration

### Environment Variables

**Main App** (`.env` and `apps/frontend-next/.env.local`):
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_RknIwce1HcJO26
RAZORPAY_KEY_SECRET=CKU27GjhtAnxygjQHAHZLSzs
RAZORPAY_PLUGIN_URL=http://localhost:5002
```

**Razorpay Plugin** (`razorpay_plugin/.env`):
```env
RAZORPAY_KEY_ID=rzp_test_RknIwce1HcJO26
RAZORPAY_KEY_SECRET=CKU27GjhtAnxygjQHAHZLSzs
PORT=5002
```

---

## 🧪 Testing

### Run Test Script
```powershell
.\test-razorpay-integration.ps1
```

### Test Cards
| Card Number | Result |
|-------------|--------|
| 4111 1111 1111 1111 | ✅ Success |
| 5555 5555 5555 4444 | ✅ Success |
| 4000 0000 0000 0002 | ❌ Failure |

---

## 📁 Key Files

### API Routes
- `apps/frontend-next/src/app/api/payments/create-order/route.ts`
- `apps/frontend-next/src/app/api/payments/verify/route.ts`

### Frontend
- `apps/frontend-next/src/app/parent/payments/page.tsx`

### Razorpay Plugin
- `razorpay_plugin/src/index.ts`
- `razorpay_plugin/src/routes/payment.routes.ts`
- `razorpay_plugin/src/services/razorpay.service.ts`

---

## 🔐 Security

- ✅ Payment signature verification (HMAC SHA256)
- ✅ Server-side validation
- ✅ PCI DSS compliant (via Razorpay)
- ✅ No card data stored locally
- ✅ Environment-based configuration

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Modal not opening | Check Razorpay plugin is running on port 5002 |
| Payment fails | Use test card: 4111 1111 1111 1111 |
| Status not updating | Check both services are running |
| Plugin won't start | Run `npm install` in razorpay_plugin |

See [RAZORPAY_SETUP_GUIDE.md](RAZORPAY_SETUP_GUIDE.md) for detailed troubleshooting.

---

## 📊 Payment Flow

1. Parent clicks "Pay Now"
2. Frontend loads Razorpay SDK
3. Creates order via API
4. Opens Razorpay checkout modal
5. Parent completes payment
6. Verifies payment signature
7. Updates database
8. Shows success message

See [RAZORPAY_FLOW_DIAGRAM.md](RAZORPAY_FLOW_DIAGRAM.md) for detailed flow.

---

## 🎯 Status

- ✅ **Development**: Complete
- 🔄 **Testing**: In Progress
- ⏳ **Staging**: Pending
- ⏳ **Production**: Pending

---

## 📞 Support

For issues or questions:
1. Check documentation files
2. Run test script
3. Check Razorpay plugin logs
4. Refer to [Razorpay Documentation](https://razorpay.com/docs/)

---

## 🎉 Success Indicators

- ✅ Razorpay plugin running on port 5002
- ✅ Main app running on port 3000
- ✅ Payment modal opens
- ✅ Test payment succeeds
- ✅ Status updates correctly
- ✅ Database records payment

---

## 📈 Next Steps

1. Complete end-to-end testing
2. Deploy to staging
3. User acceptance testing
4. Get production Razorpay keys
5. Deploy to production
6. Monitor and optimize

---

## 🔗 Resources

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Dashboard](https://dashboard.razorpay.com/)
- [Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)
- [API Reference](https://razorpay.com/docs/api/)

---

## 📝 Version History

### v1.0.0 (November 30, 2025)
- ✅ Initial integration complete
- ✅ API routes implemented
- ✅ Frontend integration done
- ✅ Security implemented
- ✅ Documentation created

---

## 👥 Contributors

- Integration Date: November 30, 2025
- Status: Complete and Ready for Testing

---

## 📄 License

This integration is part of the School SAS system.

---

**Ready to test? Start with [RAZORPAY_QUICK_START.md](RAZORPAY_QUICK_START.md)!**
