# Student Onboarding — User Stories

This document lists granular stories for the Student Onboarding epic with acceptance criteria and compact Gherkin scenarios.

---

## ONB-001 Parent Sign Up (Phone + Name)
- Story: As a Parent, I sign up with my phone number and name, set a password, and verify via OTP so I can access the application form.
- Acceptance Criteria:
  - Requires unique phone; sends OTP; blocks brute-force.
  - Password meets policy; stores hashed; session issued on verification.
  - Supports resend with rate-limit; handles wrong OTP gracefully.
- Gherkin:
  - Given the signup page
  - When I enter phone and name, set a password, and verify OTP
  - Then my account is created and I’m asked to sign in again

## ONB-002 Parent Login Before Form
- Story: As a Parent, I must sign in before accessing the application form.
- Acceptance Criteria:
  - Redirect unauthenticated users to login; remember last step after login.
  - MFA/OTP optional per tenant; session timeout handled.
- Gherkin:
  - Given I have signed up
  - When I login
  - Then I land on the onboarding dashboard with my application draft

## ONB-003 Application Form — Section 1 Admission Details
- Story: As a Parent, I fill admission details matching the paper form.
- Acceptance Criteria:
  - Fields: Admission Number, Date, Academic Year, Grade Applied, Section(if any).
  - Autosave and validation; date pickers; academic year normalized.
- Gherkin:
  - Given the Admission Details section
  - When I enter the details
  - Then the section shows Completed and data is saved

## ONB-004 Section 2 Student Personal Information
- Acceptance Criteria:
  - Fields: Full Name, DOB, Gender, Nationality, Religion, Caste/Community, Languages Known.
  - Name capitalization helper; DOB age validation.
- Gherkin: fill and see Completed status.

## ONB-005 Section 3 Address Details
- Acceptance Criteria:
  - Fields: Permanent Address, Correspondence Address, City, State, Country, PIN; toggle “Same as above”.
  - PIN format validation; address stored in structured fields.
- Gherkin: toggle “Same as above” copies values.

## ONB-006 Section 4 Parent/Guardian Information
- Acceptance Criteria:
  - Father/Mother/Guardian blocks: name, occupation, phone, email; phone/email format checks.
  - At least one guardian required; relation captured.
- Gherkin: provide details and save successfully.

## ONB-007 Section 5 Previous School Details
- Acceptance Criteria:
  - Fields: School Name, Board, Last Grade Completed, Year of Completion, Reason for Transfer.
  - Year must be past/current; reason optional free-text.
- Gherkin: save with validations.

## ONB-008 Section 6 Health & Emergency
- Acceptance Criteria:
  - Fields: Blood Group, Known Allergies, Medical Conditions, Emergency Contact Name/Number/Relationship.
  - Phone number validated; free-text fields support “None”.
- Gherkin: save and Completed.

## ONB-009 Section 7 Transport & Fee Info
- Acceptance Criteria:
  - Fields: Mode of Transport (School Bus/Own), Bus Route/Stop.
  - If School Bus, route/stop required; feeds transport fee rule later.
- Gherkin: selecting School Bus requires Route/Stop.

## ONB-010 Section 8 Technology & Consent
- Acceptance Criteria:
  - Consent statement shown; checkbox required to proceed; timestamp recorded.
- Gherkin: cannot submit until consent is checked.

## ONB-011 Section 9 Documents Submitted
- Acceptance Criteria:
  - Checkboxes or upload indicators for: TC, Report Card, Aadhaar, Passport Photos, Others(text+upload).
  - Each upload shows progress; resumable; virus scan gateway; signed URLs.
- Gherkin: uploading files marks them as received.

## ONB-012 Section 10 Declarations
- Acceptance Criteria:
  - Render declaration text; collect e-sign names for Parent/Student and Date.
  - Stores signature metadata (IP, UA snapshot).
- Gherkin: submit with signatures captured.

## ONB-013 Student Photo Upload (Mandatory)
- Story: As a Parent, I upload a student passport photo.
- Acceptance Criteria:
  - JPG/PNG; 10MB max; automatic crop helper; stored via signed URL.
  - Required for submit.
- Gherkin: attempting submit without photo blocks with message.

## ONB-014 Review Page & Submit
- Story: As a Parent, I review all sections and submit the application.
- Acceptance Criteria:
  - Shows read-only preview; indicates incomplete sections; confirm dialog.
  - On submit, status becomes submitted; events emitted; confirmation sent.
- Gherkin: submit transitions status and sends notification.

## ONB-015 Admissions Review
- Story: As an Admissions Officer, I review submitted applications and request edits if needed.
- Acceptance Criteria:
  - Can comment per section; change status to needs_changes; parent notified.
  - History/audit preserved; SLA timer visible.
- Gherkin: change status to needs_changes sends notification and unlocks form for parent.

## ONB-016 Fee Draft Creation
- Story: As an Admissions Officer, I add fee heads (school/library/skill/transport/etc.) and view total.
- Acceptance Criteria:
  - Add/edit/remove heads and amounts; discounts possible; transport auto-suggested.
  - Versioned changes with who/when; preview invoice.
- Gherkin: save draft shows a computed total and a version entry.

## ONB-017 Principal/Accountant Fee Override
- Story: As a Principal/Accountant, I adjust the fee draft and approve totals.
- Acceptance Criteria:
  - Role-gated overrides; reasons mandatory; full audit.
  - Approval produces a final fee schedule or installment plan.
- Gherkin: override triggers a new version and locks draft on approval.

## ONB-018 Installment Plan & First Payment Link
- Story: As an Accountant, I create an installment plan; the first payment link is generated immediately.
- Acceptance Criteria:
  - Define n installments with dates/amounts; balance validation; proration allowed.
  - First link created; invoice delivered via app/email/WhatsApp.
- Gherkin: saving plan emits onboarding.payment_link.created and parent receives links.

## ONB-019 Payment Receipt & Status
- Story: As a Parent, I pay using the link and receive a receipt immediately on success.
- Acceptance Criteria:
  - PSP webhook updates status; idempotent; receipt stored and downloadable.
- Gherkin: payment.succeeded updates application to payable/approved_pending.

## ONB-020 Final Approval & Provisioning
- Story: As an Admissions Officer, I approve the application and the system provisions accounts and roster entries.
- Acceptance Criteria:
  - Creates Parent user (dashboard) and Student user; assigns roll number, class, section.
  - Emits roster.student.provisioned; sends credentials to parent.
- Gherkin: approving creates users and emits event with IDs.

## ONB-021 ERP Sync & Failover
- Story: As the System, I sync data to ERP even if the ERP was temporarily unavailable.
- Acceptance Criteria:
  - Writes to local store; queues upserts; retries with exponential backoff; reconciliation report.
  - Idempotent by externalId; conflict detection and resolution rules.
- Gherkin: when ERP is down, events go to DLQ and later replay to success.

## ONB-022 Notifications
- Story: As a Parent, I receive updates via app, email, and WhatsApp at key steps.
- Acceptance Criteria:
  - Triggers: signup, submission, needs_changes, payment_link, payment_succeeded, approved, credentials_ready.
  - Uses Notification module templates with variables.
- Gherkin: emitting onboarding.approved results in multi-channel notifications.

## ONB-023 Access Control & Audit
- Story: As an Admin, I manage access per role and can audit every change.
- Acceptance Criteria:
  - RBAC policies; immutable audit log; export by date/user.
- Gherkin: fee override without permission is forbidden and logged.

## ONB-024 List & Search Applications
- Story: As Staff, I filter and search applications by status, grade, dates.
- Acceptance Criteria:
  - Sort, filter, pagination; export CSV; 2s response for common queries.
- Gherkin: filtering by Grade 8 and submitted shows the right list with counts.

## ONB-025 Data Privacy & Retention
- Story: As Compliance, I define retention and export rules for onboarding data.
- Acceptance Criteria:
  - PII encryption; document access via signed URLs; data export with consent record.
- Gherkin: exporting includes consent timestamp and signatures.

---

Status mapping: draft → submitted → needs_changes ↺ → fee_drafted → fee_finalized → payment_linked → approved → provisioned.

