# Razorpay Payment Plugin

A standalone payment gateway integration module for School ERP systems using Razorpay.

## Features

- ✅ Create payment orders with Razorpay
- ✅ Secure payment signature verification
- ✅ Webhook handling for asynchronous events
- ✅ Refund management
- ✅ MySQL database integration for audit trails
- ✅ Complete payment lifecycle tracking
- ✅ Test UI for payment flows

## Architecture

This plugin follows the architecture defined in `doc/razorpay_plugin_architecture.md`:

- **Frontend**: React-compatible payment UI with Razorpay Checkout
- **Backend**: Node.js/Express API with TypeScript
- **Database**: MySQL for payment attempts, payments, refunds, and webhook events
- **Security**: Signature verification for payments and webhooks

## Prerequisites

- Node.js >= 20
- MySQL >= 5.7
- Razorpay account (test or production)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from example:
```bash
copy .env.example .env
```

3. Configure environment variables in `.env`:
```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=school_erp

FRONTEND_URL=http://localhost:5002
BACKEND_URL=http://localhost:5002
```

4. Set up database:
```bash
mysql -u root -p school_erp < sql/schema.sql
```

## Development

Start development server with hot reload:
```bash
npm run dev
```

Build for production:
```bash
npm run build
npm start
```

## API Endpoints

### Payment Operations

#### Create Order
```http
POST /api/payments/create-order
Content-Type: application/json

{
  "invoiceId": 1001,
  "amount": 100.00,
  "currency": "INR"
}
```

#### Verify Payment
```http
POST /api/payments/verify
Content-Type: application/json

{
  "razorpay_payment_id": "pay_xxxxx",
  "razorpay_order_id": "order_xxxxx",
  "razorpay_signature": "signature_xxxxx"
}
```

#### Create Refund
```http
POST /api/payments/refund
Content-Type: application/json

{
  "paymentId": 1,
  "razorpay_payment_id": "pay_xxxxx",
  "amount": 50.00,
  "reason": "Customer request"
}
```

#### Get Payment Details
```http
GET /api/payments/:paymentId
```

### Webhook

#### Razorpay Webhook
```http
POST /api/webhooks/razorpay
X-Razorpay-Signature: signature_xxxxx
Content-Type: application/json

{
  "event": "payment.captured",
  "payload": { ... }
}
```

## Testing

1. Open browser to `http://localhost:5002`
2. Enter invoice ID and amount
3. Click "Pay Now with Razorpay"
4. Use test card: `4111 1111 1111 1111`
5. CVV: Any 3 digits
6. Expiry: Any future date

## Database Schema

### payment_attempts
Tracks all payment initiation attempts.

### payments
Stores successful payment records with Razorpay payment IDs.

### refunds
Manages refund transactions.

### webhook_events
Logs all webhook events from Razorpay for audit and debugging.

### invoices
Sample invoice table for testing (integrate with your ERP's invoice system).

## Security

- All payment signatures are verified using HMAC SHA256
- Webhook signatures are validated before processing
- Sensitive credentials stored in environment variables
- No raw card data is stored (PCI compliance)
- Idempotent webhook processing to prevent duplicates

## Webhook Setup

1. Log in to Razorpay Dashboard
2. Go to Settings → Webhooks
3. Add webhook URL: `https://your-domain.com/api/webhooks/razorpay`
4. Select events:
   - payment.captured
   - payment.failed
   - refund.processed
   - refund.failed
5. Copy webhook secret to `.env` as `RAZORPAY_WEBHOOK_SECRET`

## Production Deployment

1. Set `NODE_ENV=production`
2. Use production Razorpay keys
3. Enable HTTPS for webhook endpoint
4. Set up proper database backups
5. Configure monitoring and alerts
6. Review and adjust connection pool settings

## Troubleshooting

### Payment signature verification fails
- Ensure `RAZORPAY_KEY_SECRET` is correct
- Check that order_id and payment_id match

### Webhook not receiving events
- Verify webhook URL is publicly accessible
- Check `RAZORPAY_WEBHOOK_SECRET` matches dashboard
- Review webhook logs in Razorpay dashboard

### Database connection errors
- Verify MySQL credentials in `.env`
- Ensure database exists and schema is created
- Check connection pool settings

## License

MIT
