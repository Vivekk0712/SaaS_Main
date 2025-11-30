# Razorpay Plugin - Quick Start Guide

Get the Razorpay payment plugin running in 5 minutes.

## Step 1: Install Dependencies

```bash
cd razorpay_plugin
npm install
```

## Step 2: Configure Environment

Create `.env` file:

```bash
copy .env.example .env
```

Edit `.env` with your credentials:

```env
# Get these from https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxx

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=school_erp

# Server
PORT=5002
FRONTEND_URL=http://localhost:5002
BACKEND_URL=http://localhost:5002
```

## Step 3: Set Up Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE IF NOT EXISTS school_erp;
USE school_erp;
SOURCE sql/schema.sql;
```

Or using command line:
```bash
mysql -u root -p school_erp < sql/schema.sql
```

## Step 4: Start the Server

Development mode (with hot reload):
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## Step 5: Test Payment Flow

1. Open browser: `http://localhost:5002`
2. Enter test details:
   - Invoice ID: `1001`
   - Amount: `10`
3. Click "Pay Now with Razorpay"
4. **Recommended**: Select UPI tab and enter: `success@razorpay`
   - OR use test card: `5267 3181 8797 5449`, CVV: `123`, Expiry: `12/25`
5. Complete payment

## Test Payment Methods

### Recommended: UPI (Fastest)
- UPI ID: `success@razorpay` - Payment succeeds
- UPI ID: `failure@razorpay` - Payment fails

### Test Cards (Indian)
| Card Number | Type | Behavior |
|-------------|------|----------|
| 5267 3181 8797 5449 | Mastercard Debit | Success |
| 4111 1111 1111 1111 | Visa | International (blocked in test) |

**Note**: International cards are blocked in Razorpay test mode. Use Indian test cards or UPI.

## Webhook Testing (Optional)

For local webhook testing, use ngrok:

```bash
ngrok http 5002
```

Then configure webhook in Razorpay Dashboard:
- URL: `https://your-ngrok-url.ngrok.io/api/webhooks/razorpay`
- Events: payment.captured, payment.failed, refund.processed

## API Testing

### Create Order
```bash
curl -X POST http://localhost:5002/api/payments/create-order \
  -H "Content-Type: application/json" \
  -d "{\"invoiceId\": 1001, \"amount\": 100}"
```

### Check Health
```bash
curl http://localhost:5002/health
```

## Common Issues

### Database Connection Error
- Verify MySQL is running
- Check credentials in `.env`
- Ensure database exists

### Razorpay API Error
- Verify test keys are correct
- Check internet connection
- Review Razorpay dashboard for API status

### Port Already in Use
Change port in `.env`:
```env
PORT=5003
```

## Next Steps

- Review `README.md` for complete documentation
- Check `doc/razorpay_plugin_architecture.md` for architecture details
- Integrate with your ERP's invoice system
- Set up production webhook endpoint
- Configure monitoring and alerts

## Support

For issues or questions:
1. Check logs in console
2. Review Razorpay dashboard for payment status
3. Check `webhook_events` table for webhook logs
4. Review architecture documentation
