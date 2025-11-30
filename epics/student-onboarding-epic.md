# Student Onboarding Epic — School SAS

## Summary
Create a standalone Student Onboarding module that collects admission data from parents via a clean web form, routes applications to the Admissions team for review and fee setup, supports principal/accountant adjustments, and issues installment-ready payment links with instant invoices and notifications. On approval, provision portal credentials for Parent and Student and create the basic student record (without class/section/roll). Roster fields (class, section, roll number) are assigned later by the HOD module in the ERP. The module runs independently but links data with the core ERP through APIs/events so that if one system is down, the other still functions and reconciles later.

## Goals
- Smooth, mobile-first parent experience with photo/document uploads.
- Clear back-office workflow: review → feeing → approval → provisioning (roster by HOD later).
- Installments with immediate first-link generation and instant invoice.
- Fault-tolerant, event-driven integration with the rest of SAS (decoupled).
- Secure handling of PII and documents; auditable decisions and changes.

## Out of Scope (initial)
- Teacher assignment by HOD (done in Academics module; consumes events).
- Full accounting ledger (handled by Finance/Payment modules).

## Personas
- Parent/Guardian (applicant)
- Admissions Officer (review and fee entry)
- Principal (final approval, fee override)
- Accountant (fee review/override; payment plan confirmation)
- System Integrations (ERP roster, Payment, Notification)

## High-level Flow
1) Sign up: Parent enters phone and name, sets password, verifies OTP, signs in.
2) Application form: 10 sections mirroring the paper form; photo/docs upload.
3) Submit → Application created with status `submitted`; confirmation to parent.
4) Admissions Officer reviews, requests edits if needed, assigns provisional class, drafts fee heads (school/library/skill/etc.).
5) Principal/Accountant can adjust fees; finalize total or create installment plan.
6) System generates first payment link immediately; sends via app, email, WhatsApp; invoice available to parent.
7) On payment or manual approval, issue Admission Approval; create Student and Parent accounts in the portal; emit a roster assignment request so HOD can assign class/section/roll in their module; notify parent that roster details will follow.

## Form Sections (must match UI)
1. Admission Details (Admission No, Date, Academic Year, Grade Applied, Section)
2. Student Personal Information (Name, DOB, Gender, Nationality, Religion, Caste/Community, Languages)
3. Address Details (Permanent, Correspondence, PIN, City, State, Country)
4. Parent/Guardian Information (Father/Mother/Guardian: name, occupation, phone, email)
5. Previous School Details (School, Board, Last Grade, Year, Reason for Transfer)
6. Health & Emergency (Blood Group, Allergies, Medical Conditions, Emergency Contact Name/Phone/Relation)
7. Transport & Fee Info (Mode of Transport, Bus Route/Stop)
8. Technology & Consent (device/internet consent statement checkbox)
9. Documents Submitted (TC, Report Card, Aadhaar, Passport photos, others)
10. Declarations (acknowledgement text, e-sign captures: parent, student, date)
11. Uploads (student photo mandatory; doc uploads per section 9)

## Functional Requirements
- Parent onboarding & auth
  - Capture phone + parent name; set password; OTP verification; re-login required before filling form.
- Application form
  - Clean, real-looking digital form; autosave drafts; file uploads with progress.
  - Validation and per-section completion status; review page before submit.
- Review & approval workflow
  - Admissions review with comments; send back to parent for edits; track history.
  - Fee setup by Admissions; override capability by Principal/Accountant with audit.
- Fees & payments
  - Fee heads (school, library, skill, transport, etc.), discounts, and installment plan.
  - Immediate first payment link; invoice issued and delivered via app/email/WhatsApp.
- Provisioning & sync
  - On approval: create Parent+Student users and the basic Student record (no class/section/roll yet).
  - Emit events to request roster assignment from HOD; when HOD completes, consume the event and update ERP mapping; then notify parent of assigned class/section/roll.
- Failover
  - If ERP or Payments are down, queue events and retry; parent sees clear status.

## Non‑Functional Requirements
- Availability: 99.5% for application capture; durable queueing for integrations.
- Security: PII encryption at rest; signed URLs for documents; RBAC by role.
- Compliance: Consent capture, data retention and export, audit logs for fee changes.
- Performance: Form save < 300ms avg; document upload chunked; list views < 2s.

## Data Model (summary)
- Application(id, status, academicYear, gradeApplied, section?, submittedAt)
- StudentProfile(id, person, addresses, health, transport, previousSchool)
- ParentProfile(id, person, contacts, relation, users[])
- FeeDraft(id, applicationId, heads[], discounts[], total, installmentPlan?)
- Decision(id, applicationId, decidedBy, outcome, notes, decidedAt)
- Provisioning(id, applicationId, studentId, parentUserId, rosterRequestedAt, rosterAssignedAt?)

See `docs/erp-onboarding-data-contract.md` for JSON contracts.

## API Surface (draft)
- POST /api/onboarding/public/signup
- POST /api/onboarding/public/login
- POST /api/onboarding/applications (create/update/submit)
- GET  /api/onboarding/applications/:id
- POST /api/onboarding/applications/:id/review
- POST /api/onboarding/applications/:id/fees
- POST /api/onboarding/applications/:id/approve
- POST /api/onboarding/applications/:id/payment-link
- POST /api/onboarding/events/webhooks (payments, notifications)

## Events
- onboarding.application.submitted
- onboarding.application.needs_changes
- onboarding.fees.finalized
- onboarding.payment_link.created
- onboarding.approved
- roster.assignment.requested (to HOD)
- roster.assignment.completed (from HOD)

## Risks & Mitigations
- Payment gateway outage → Queue link creation; notify parent; retry with backoff.
- Document storage failure → Local cache + resume upload; signed URL expiry rotation.
- Data mismatch with ERP → Contract tests; idempotent upserts; reconciliation report.

## Success Metrics
- Application completion rate, time-to-approval, first payment conversion, % auto-provisioned without manual help, average review turnaround.

## Rollout
- Pilot with one grade; collect feedback on UX and data quality; then expand.

## Open Questions
- Do we mandate OTP for every login during onboarding?
- Transport fee calculation rules per route/stop?
