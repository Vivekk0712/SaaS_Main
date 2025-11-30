# ADR 0005: Payments — Razorpay

Status: Accepted

Context
- PRD requires secure online fee payments, receipts, and accountant reconciliation. Target market prioritizes Razorpay integration.

Decision
- Integrate Razorpay as the primary payment gateway. Support webhooks for payment lifecycle and issue receipts on success.

Consequences
- Pros: Strong India market support, UPI/NetBanking/Wallets, robust APIs.
- Cons: Vendor‑specific webhook formats; additional provider for global expansion if needed.

Implementation
- Payment service abstractions for gateway operations; create payment intents and checkout sessions.
- Verify webhook signatures; ensure idempotency on callbacks; persist transactions and generate PDF receipts.
- Map invoices to Razorpay orders; expose accountant dashboards for reconciliation.

Security
- Do not store card data; comply with PCI by redirecting to provider checkout; secure webhooks; audit logs for financial events.

Operational Notes
- Monitor success/failure rates, refund flows, and settlement delays; retry failed webhooks with backoff.

