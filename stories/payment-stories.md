# Payment Module — User Stories

This document lists granular user stories for the Payment epic with acceptance criteria and concise Gherkin scenarios.

---

## PAY-001 Create Fee Structure
- Story: As a Finance Admin, I create fee structures with heads and due dates so invoices are generated correctly.
- Acceptance Criteria:
  - Must define heads, amounts, due dates, applicable classes.
  - Changes are versioned; preview shows per-student invoice.
  - Validation prevents overlapping/duplicate heads.
- Gherkin:
  - Given a new fee structure form
  - When I add heads and set a due date
  - Then I see a per-student invoice preview and can save a versioned structure

## PAY-002 Generate Invoices in Bulk
- Story: As a Finance Admin, I bulk-generate invoices for a class/batch to notify parents.
- Acceptance Criteria:
  - Idempotent bulk run avoids duplicate invoices for the same period.
  - Generates unique invoice IDs and audit entries.
  - Triggers notification events on success.
- Gherkin:
  - Given fee structures exist for Grade 8
  - When I run bulk invoice for Grade 8 May
  - Then invoices are created once per student and an event invoice.created is emitted

## PAY-003 Hosted Checkout Payment
- Story: As a Parent, I pay via card/UPI/net-banking/wallet using a secure hosted checkout.
- Acceptance Criteria:
  - Link opens PSP page with correct amount and invoice reference.
  - Success returns receipt; failure shows retry without double charge.
  - Payment status updates asynchronously via webhook.
- Gherkin:
  - Given an unpaid invoice and a payment link
  - When I complete payment on the PSP page
  - Then the invoice status becomes paid and a receipt is available

## PAY-004 Partial Payment/Installment (v2)
- Story: As a Parent, I make partial payments per an installment plan.
- Acceptance Criteria:
  - Remaining balance is visible; late rules apply; reminders sent.
  - Schedule enforces minimum amounts and dates.
- Gherkin:
  - Given an installment plan with 3 dues
  - When I pay the first installment
  - Then the balance reflects remaining dues and the next due date is scheduled

## PAY-005 Refund Processing
- Story: As a Finance Admin, I issue full/partial refunds with reasons and permissions.
- Acceptance Criteria:
  - Role-gated action; reason required; PSP status synchronized.
  - Reverses receipt and logs audit entry.
- Gherkin:
  - Given a captured payment
  - When I issue a partial refund of 500 with reason "overcharge"
  - Then the payment shows refunded=500 and an audit log is recorded

## PAY-006 Reconciliation of Settlements
- Story: As a Finance Admin, I reconcile settlements and export ledgers.
- Acceptance Criteria:
  - Import provider settlement file; auto-match >99%.
  - Reports show matched/unmatched; CSV export.
- Gherkin:
  - Given a settlement file for 2025-05-01
  - When I import and run auto-match
  - Then matched transactions are marked settled and unmatched are listed for manual review

## PAY-007 Discounts/Scholarships
- Story: As a Finance Admin, I apply discounts/scholarships based on rules.
- Acceptance Criteria:
  - Rule engine applies eligibility; per-invoice visibility; audit trail.
- Gherkin:
  - Given a 25% sibling discount rule
  - When invoices are generated
  - Then eligible students receive discounted totals with the rule referenced

## PAY-008 Offline Payment Entry (v2)
- Story: As a Cashier, I record a cash/cheque payment with approval.
- Acceptance Criteria:
  - Two-step approval; receipt generated after approval; prevents duplicates.
- Gherkin:
  - Given a submitted offline cash entry
  - When a Finance Admin approves it
  - Then the invoice becomes paid and a receipt is issued

## PAY-009 Dunning and Reminders
- Story: As a Finance Admin, I configure automated reminders for due and overdue invoices.
- Acceptance Criteria:
  - Schedules per tenant; throttle; opt-outs respected.
- Gherkin:
  - Given an invoice due in 3 days
  - When the schedule runs
  - Then a due_soon notification is sent honoring preferences

## PAY-010 Finance Exports
- Story: As an Auditor, I export reports with tamper-evident hashes.
- Acceptance Criteria:
  - Date and class filters; signed hash; CSV/Excel formats.
- Gherkin:
  - Given I select May finance range
  - When I export ledgers
  - Then the file downloads with a signature hash and metadata

