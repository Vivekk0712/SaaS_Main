# Payment Module Epic — School SAS

## Summary
Enable secure, flexible, and compliant collection of student fees with automated invoicing, multi-method payments, refunds, discounts, reconciliation, and reporting.

## Vision & Objectives
- Increase on-time collections and transparency for parents and finance teams.
- Reduce manual back-office work through automation and reliable integrations.
- Provide auditable, exportable financial records aligned with compliance needs.

## Scope
- In: Fee structures, invoices, checkout, receipts, refunds, reconciliation, exports, reminders, discounts, installments (v2), offline entries (v2).
- Out (initial): Full ERP accounting, crypto, complex tax advisory, chargeback arbitration desk.

## Personas
- Finance Admin: Creates fees, manages invoices, refunds, and reconciliation.
- Parent/Guardian: Reviews dues and pays via preferred method.
- Teacher/Staff: Views fee status for their classes (read-only).
- Auditor: Reviews exports and compliance artifacts.

## Assumptions
- Integrate with at least one PSP (e.g., Razorpay/Stripe/PayU) for hosted checkout.
- Institution-configured currency and tax rules (GST/VAT) per tenant.
- Webhooks from PSP are reliable and signed.

## Functional Requirements
- MVP
  - Fee structure setup (heads, schedules, classes, scholarships/discounts).
  - Invoice generation (bulk, per student, one-offs) with unique IDs.
  - Hosted checkout links (card/UPI/net-banking/wallet) and QR where applicable.
  - Receipt issuance, refund initiation (full/partial), status sync from PSP.
  - Reconciliation of settlements and payouts; matched/unmatched views.
  - Exports (CSV/Excel) for ledgers, invoices, and settlements.
  - Automated reminders (before due, due, overdue) via Notification module.
- Next (v2+)
  - Installments/subscriptions; partial payments with schedules.
  - Discount codes and scholarship rules with eligibility checks.
  - Offline entries (cash/cheque) with two-step approval and audit.
  - Multi-PSP routing, failover, and routing rules.

## Detailed User Stories
- As a Finance Admin, I define fee structures with due dates so invoices are generated automatically.
  - Acceptance: Create/Update versioned fee heads; preview invoice per student; audit trail recorded.
- As a Finance Admin, I generate invoices for a batch/class and send payment links.
  - Acceptance: Bulk run avoids duplicates; sends notifications; supports retry.
- As a Parent, I pay via preferred method with clear success/failure feedback.
  - Acceptance: Hosted checkout; idempotent retries; receipt available instantly.
- As a Finance Admin, I issue partial refunds and capture reasons.
  - Acceptance: Permission-gated; notes mandatory; PSP status synced; receipt reversed.
- As a Finance Admin, I reconcile settlements to transactions and mark exceptions.
  - Acceptance: Import settlement reports; show matched/unmatched; export CSV.
- As an Auditor, I download monthly reports and verify tamper evidence.
  - Acceptance: Signed hashes and immutable audit logs.

## Workflows
1) Fee setup → Invoice generation → Notification → Checkout → Receipt.
2) Refund: Request → Approval (RBAC) → PSP API → Status sync → Reverse receipt.
3) Reconciliation: Import settlements → Auto-match → Manual resolve → Export ledger.

## Data Model (Overview)
- FeeStructure(id, name, heads[], schedule, classIds, version, active)
- FeeHead(id, label, amount, taxRuleId, optional)
- Invoice(id, studentId, amount, dueDate, status, balance, feeHeadBreakdown[], discounts[], installmentPlanId)
- Payment(id, invoiceId, pspRef, method, amount, status, capturedAt)
- Refund(id, paymentId, amount, reason, status, pspRef)
- Settlement(id, pspBatchId, date, amount, fees, status)
- DiscountRule(id, type, criteria, value, startAt, endAt)

## API Surface (Draft)
- POST /api/fees/structures
- GET /api/fees/structures/:id
- POST /api/invoices/generate
- GET /api/invoices/:id
- POST /api/invoices/:id/payment-link
- POST /api/payments/webhooks/psp
- POST /api/payments/:paymentId/refunds
- POST /api/reconciliation/settlements/import
- GET /api/reports/finance/exports

## Integrations
- PSP: Create order, hosted checkout link, capture, refund, webhooks.
- Accounting: CSV/Excel export for import into ERP (e.g., Tally, ZohoBooks).

## Events & Notifications
- invoice.created, invoice.due_soon, invoice.overdue, payment.succeeded, payment.failed, refund.processed, reconciliation.completed.

## Security, Privacy & Compliance
- No raw card data stored; rely on PSP tokenization; PCI scope minimized.
- Signed webhooks (HMAC); replay protection with idempotency keys.
- PII encryption at rest; strict RBAC; audit log for finance actions.

## Non-Functional Requirements
- Availability: 99.9% for checkout and invoice APIs.
- Performance: Checkout load < 3s; bulk invoice 1k students < 30s.
- Observability: Trace payment lifecycle; dashboards for success rates and mismatches.

## Operations & Runbook
- Webhook retry/backoff with dead-letter queue monitoring.
- Reconciliation job daily at off-peak; manual re-run support.
- Incident playbook for PSP outage: switch to alternate PSP (v2), communicate via status page.

## Dependencies
- Notification module for reminders/receipts.
- Roster data from Education Content for invoice targeting.

## Risks & Mitigations
- PSP downtime → Multi-PSP (v2), clear failure UX, queue retries.
- Disputes/chargebacks → Refund workflow, documentation, evidence export.
- Tax/regulatory changes → Configurable tax rules and regular updates.

## Migration & Rollout
- Pilot with one institution; shadow reconciliation; compare with legacy numbers.
- Gradual enablement of refunds and discounts after stability.

## Testing Strategy
- Contract tests against PSP sandbox; webhook signature verification tests.
- Idempotency and retry tests; bulk invoice generation property tests.
- Reconciliation matching accuracy tests with synthetic data.

## Metrics & KPIs
- On-time payment rate, DSO, refund turnaround, reconciliation match rate, failed payment ratio.

## Roadmap
- M0–M2: Fee structures, invoices, hosted checkout, receipts, basic reconciliation.
- M2–M4: Installments, discounts, offline entries, reconciliation UI.
- M4+: Multi-PSP routing, deeper accounting exports.

## Open Questions
- Regional surcharge handling per payment method?
- Scholarship approval workflow—who approves and how many steps?

## Glossary
- PSP: Payment Service Provider. DSO: Days Sales Outstanding. RBAC: Role-Based Access Control.

