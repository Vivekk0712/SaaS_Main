# Razorpay Plugin - Implementation Architecture

## Overview

This plugin implements the architecture defined in `doc/razorpay_plugin_architecture.md` as a standalone payment service for School ERP systems.

## Technology Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MySQL 5.7+
- **Payment Gateway**: Razorpay SDK
- **Validation**: Zod
- **Logging**: Pino

## Project Structure

```
razorpay_plugin/
├── src/
│   ├── config/
│   │   ├── env.ts              # Environment configuration
│   │   ├── logger.ts           # Logging setup
│   │   └── database.ts         # MySQL connection pool
│   ├── domain/
│   │   └── payment.types.ts    # Type definitions and schemas
│   ├── repositories/
│   │   └── payment.repository.ts  # Database operations
│   ├── services/
│   │   └── razorpay.service.ts    # Razorpay API integration
│   ├── routes/
│   │   ├── payment.routes.ts      # Payment endpoints
│   │   └── webhook.routes.ts      # Webhook handler
│   └── index.ts                # Application entry point
├── public/
│   └── index.html              # Test UI
├── sql/
│   └── schema.sql              # Database schema
├── .env                        # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

## Core Components

### 1. Configuration Layer (`src/config/`)

#### env.ts
- Validates environment variables using Zod
- Ensures all required credentials are present
- Provides type-safe configuration access

#### logger.ts
- Structured logging with Pino
- Pretty printing in development
- JSON logs in production

#### database.ts
- MySQL connection pool management
- Connection testing and health checks
- Automatic reconnection handling

### 2. Domain Layer (`src/domain/`)

#### payment.types.ts
Defines core types and validation schemas:
- `CreateOrderRequest` - Order creation payload
- `VerifyPaymentRequest` - Payment verification data
- `RefundRequest` - Refund initiation data
- `PaymentAttempt` - Payment attempt record
- `Payment` - Successful payment record
- `Refund` - Refund transaction record
- `WebhookEvent` - Webhook event log

### 3. Repository Layer (`src/repositories/`)

#### payment.repository.ts
Handles all database operations:
- `createPaymentAttempt()` - Store payment initiation
- `updatePaymentAttempt()` - Update attempt status
- `getPaymentAttemptByOrderId()` - Retrieve attempt by order
- `createPayment()` - Store successful payment
- `getPaymentByRazorpayId()` - Retrieve payment record
- `createRefund()` - Store refund transaction
- `updateRefundStatus()` - Update refund status
- `storeWebhookEvent()` - Log webhook events
- `isWebhookProcessed()` - Check for duplicate webhooks

### 4. Service Layer (`src/services/`)

#### razorpay.service.ts
Integrates with Razorpay API:
- `createOrder()` - Create Razorpay order
- `verifyPaymentSignature()` - Verify payment signature
- `verifyWebhookSignature()` - Verify webhook signature
- `fetchPayment()` - Get payment details from Razorpay
- `capturePayment()` - Capture authorized payment
- `createRefund()` - Initiate refund
- `fetchRefund()` - Get refund details
- `getKeyId()` - Get public key for frontend

### 5. Routes Layer (`src/routes/`)

#### payment.routes.ts
Payment API endpoints:
- `POST /api/payments/create-order` - Create order
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/refund` - Initiate refund
- `GET /api/payments/:paymentId` - Get payment details

#### webhook.routes.ts
Webhook handling:
- `POST /api/webhooks/razorpay` - Receive Razorpay webhooks
- Event processing for:
  - `payment.captured`
  - `payment.failed`
  - `refund.processed`
  - `refund.failed`

## Payment Flow

### 1. Order Creation Flow

```
Frontend → POST /api/payments/create-order
    ↓
Validate request (Zod)
    ↓
Create payment_attempt record (status: created)
    ↓
Call Razorpay Orders API
    ↓
Store razorpay_order_id
    ↓
Return order details + key_id to frontend
```

### 2. Payment Verification Flow

```
Frontend → POST /api/payments/verify
    ↓
Verify signature (HMAC SHA256)
    ↓
Fetch payment from Razorpay
    ↓
Update payment_attempt (status: captured/completed)
    ↓
Create payment record
    ↓
Return success response
```

### 3. Webhook Processing Flow

```
Razorpay → POST /api/webhooks/razorpay
    ↓
Verify webhook signature
    ↓
Check if already processed (idempotency)
    ↓
Store webhook_event
    ↓
Process event based on type
    ↓
Update payment/refund status
    ↓
Mark event as processed
```

### 4. Refund Flow

```
Admin → POST /api/payments/refund
    ↓
Validate request
    ↓
Get payment from database
    ↓
Call Razorpay Refunds API
    ↓
Store refund record (status: processing)
    ↓
Return refund details
    ↓
(Later) Webhook updates status to successful/failed
```

## Security Measures

### 1. Signature Verification

**Payment Signature**:
```typescript
HMAC_SHA256(order_id + "|" + payment_id, key_secret)
```

**Webhook Signature**:
```typescript
HMAC_SHA256(webhook_payload, webhook_secret)
```

### 2. Environment Security
- Secrets stored in `.env` (not in source control)
- `.gitignore` prevents accidental commits
- Separate test and production keys

### 3. Database Security
- Parameterized queries prevent SQL injection
- Connection pooling with limits
- No sensitive card data stored

### 4. Idempotency
- Unique `attempt_reference` for each order
- Webhook event deduplication
- Prevents double charges

## Database Design

### payment_attempts
Primary table for tracking all payment initiations:
- Links to invoice via `invoice_id`
- Stores Razorpay `order_id` and `payment_id`
- Tracks status progression
- JSON metadata for flexibility

### payments
Successful payment records:
- Links to `payment_attempt_id`
- Stores payment method and fees
- Captures timestamp
- Full Razorpay response in JSON

### refunds
Refund transaction tracking:
- Links to `payment_id`
- Tracks refund status
- Stores Razorpay refund response

### webhook_events
Audit log for all webhooks:
- Event type and payload
- Processing status
- Error logs for debugging

## Error Handling

### API Errors
- Validation errors return 400 with details
- Authentication errors return 401
- Not found errors return 404
- Server errors return 500 with safe message

### Webhook Errors
- Always return 200 to prevent retries
- Log errors in `processing_log`
- Mark event as unprocessed for manual review

### Database Errors
- Connection pool handles reconnection
- Transactions for critical operations
- Detailed error logging

## Monitoring & Observability

### Logging
- Structured JSON logs
- Request/response logging via pino-http
- Error stack traces in development
- Sensitive data masking

### Health Checks
- `GET /health` endpoint
- Database connection test
- Service status reporting

### Metrics to Monitor
- Payment success rate
- Average payment time
- Webhook processing time
- Failed signature verifications
- Database connection pool usage

## Testing Strategy

### Unit Tests
- Service layer methods
- Signature verification
- Data validation

### Integration Tests
- API endpoint testing
- Database operations
- Razorpay API mocking

### Manual Testing
- Test UI at `/`
- Test cards from Razorpay
- Webhook simulation

## Deployment Considerations

### Environment Setup
1. Production Razorpay keys
2. Secure database credentials
3. HTTPS for webhook endpoint
4. Proper CORS configuration

### Scaling
- Horizontal scaling supported
- Stateless design
- Database connection pooling
- Consider Redis for session management

### Monitoring
- Application logs to centralized system
- Database query performance
- API response times
- Payment success/failure rates

## Integration with ERP

### Invoice System
Replace sample `invoices` table with your ERP's invoice system:
```typescript
// Fetch invoice from your ERP
const invoice = await erpService.getInvoice(invoiceId);

// Validate amount matches
if (invoice.amount_due !== request.amount) {
  throw new Error('Amount mismatch');
}
```

### Student Management
Link payments to student records:
```typescript
// Get student from payment
const attempt = await paymentRepo.getPaymentAttempt(id);
const invoice = await erpService.getInvoice(attempt.invoice_id);
const student = await erpService.getStudent(invoice.student_id);
```

### Accounting Integration
Update ledgers after successful payment:
```typescript
// In webhook handler after payment.captured
await accountingService.recordPayment({
  student_id: invoice.student_id,
  amount: payment.amount,
  payment_id: payment.razorpay_payment_id,
  date: new Date(),
});
```

## Future Enhancements

1. **Partial Payments**: Support installment payments
2. **Payment Plans**: Recurring payment setup
3. **Multi-currency**: Support international payments
4. **Payment Links**: Generate shareable payment links
5. **Reconciliation**: Automated settlement reconciliation
6. **Analytics Dashboard**: Payment metrics and reports
7. **Retry Logic**: Automatic retry for failed webhooks
8. **Rate Limiting**: Protect against abuse
9. **Caching**: Redis for frequently accessed data
10. **Background Jobs**: Queue for async processing

## References

- [Razorpay API Documentation](https://razorpay.com/docs/api/)
- [Razorpay Checkout Documentation](https://razorpay.com/docs/payments/payment-gateway/web-integration/)
- [Razorpay Webhooks](https://razorpay.com/docs/webhooks/)
- Architecture Document: `doc/razorpay_plugin_architecture.md`
