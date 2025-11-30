# School SAS — Product Epics

This document defines clear epics for four core modules of the School SAS platform and a consolidated roadmap. Each epic includes goals, scope, key user stories, acceptance criteria, dependencies, risks, non‑functional requirements, and success metrics.

---

## 1) Payment Module Epic

### Epic Summary
Enable schools to collect, manage, and reconcile fees and payments securely across multiple methods with automated invoicing, discounts, and reporting.

### Business Value
- Improve on‑time collections and reduce administrative overhead
- Offer flexible payment options to increase parent satisfaction
- Provide transparent, auditable records for finance and compliance

### Goals
- Support major payment methods (cards, UPI, net banking, wallets)
- Automated invoices, reminders, and receipts
- Partial payments, installments, and scholarships/discounts
- Real‑time reconciliation and ledger export

### Non‑Goals (initial)
- Native crypto payments
- Complex ERP‑grade accounting beyond exports and summaries

### Users & Personas
- Admin: Finance officer managing fees and reconciliation
- Parent/Guardian: Paying student fees
- Teacher/Staff: Viewing fee status for their classes
- Auditor: Reviewing compliance reports

### Assumptions & Constraints
- Integrate with at least one PSP (e.g., Razorpay/Stripe/PayU)
- Currency configured per tenant; multi‑currency optional later
- GST/Tax handling as configurable rules per institution

### High‑Level Workflow
1. Define fee structures and schedules
2. Generate invoices per student/class
3. Notify and collect payments via hosted checkout
4. Issue receipts; update fee status
5. Reconcile payouts; export ledgers to accounting

### Scope
- MVP
  - Fee structure and invoice generation
  - Payment links and hosted checkout via PSP
  - Receipts, refunds (full/partial), and status tracking
  - Basic reconciliation and payout reports
  - Automated reminders and dunning
- Next (v2+)
  - Installments and subscriptions
  - Scholarships/discounts and voucher codes
  - Offline cash/cheque entry with approval
  - Multi‑PSP routing and failover

### Key User Stories
- As an Admin, I create fee structures (tuition, transport, lab) with schedules, so that invoices are generated automatically.
  - Acceptance: Can define heads, amounts, due dates; preview invoice per student; version‑controlled changes.
- As an Admin, I generate invoices per batch/class, so that parents receive timely requests.
  - Acceptance: Bulk generation, duplicate prevention, audit trail.
- As a Parent, I can pay via card/UPI/net banking/wallet, so that I complete payment conveniently.
  - Acceptance: Secure hosted checkout, saved payer info, success/failure clear state, retry without duplicate charge.
- As a Parent, I can make partial payments or installments, so that I manage affordability.
  - Acceptance: Remaining balance visible, schedule enforcement, reminders for dues.
- As an Admin, I issue refunds (full/partial), so that disputes are resolved.
  - Acceptance: Permission‑gated, notes required, PSP status synced, receipt reversal recorded.
- As an Admin, I reconcile payouts, so that finance ledgers are complete.
  - Acceptance: PSP settlement import, matched/unmatched view, export to CSV/Excel.
- As an Admin, I configure discounts/scholarships, so that eligibility reduces payable amount.
  - Acceptance: Rule‑based application, audit log, per‑invoice visibility.
- As an Admin, I get automated reminders (before due, due, overdue), so that collections improve.
  - Acceptance: Schedule templates, throttle, opt‑outs respected.
- As an Auditor, I export reports, so that compliance audits are supported.
  - Acceptance: Date‑range, fee head, class filters; tamper‑evident hashes.

### Acceptance Criteria (Epic‑level)
- PCI compliance via PSP; no raw card data stored
- End‑to‑end payment flow observable with idempotency keys
- Reconciliation accuracy ≥ 99.5% on matched transactions
- P0 error budget SLO: < 0.1% failed but charge captured mismatches

### Dependencies
- Notification module for reminders and receipts
- Student/roster data from Education Content module
- PSP integration and webhook reliability

### Risks & Mitigations
- PSP downtime → Multi‑PSP fallback (v2), clear error messaging
- Charge disputes → Refund workflow + audit trail
- Compliance changes → Configurable tax and fee rules

### Non‑Functional Requirements
- Security: Encrypted PII, signed webhooks, RBAC for finance actions
- Reliability: 99.9% uptime for checkout and invoice APIs
- Observability: Trace payment lifecycle, reconciliation dashboard
- Performance: < 3s to render checkout; < 30s bulk invoice per 1k students

### Success Metrics
- DSO reduction by 20%
- On‑time payment rate +25%
- Refund resolution median < 3 business days

---

## 2) Notification Module Epic

### Epic Summary
Provide reliable, configurable multi‑channel communications (email, SMS, push, in‑app) for transactional and scheduled school messages with user preferences and analytics.

### Business Value
- Increase engagement and timely actions (payments, attendance)
- Reduce manual calls and paper notices
- Improve deliverability and compliance with opt‑ins

### Goals
- Unified template system with variables and localization
- Event‑driven and scheduled notifications
- Per‑user channel preferences and quiet hours
- Delivery analytics and retries

### Non‑Goals (initial)
- Complex marketing campaign tooling beyond basic segments
- Rich CRM workflows

### Users & Personas
- Admin: Configures templates and policies
- Teacher/Staff: Triggers class announcements
- Parent/Student: Receives notifications; manages preferences

### Assumptions & Constraints
- Integrate with at least one provider per channel (Email/SMS/Push)
- Regional SMS template approvals as required

### High‑Level Workflow
1. Define templates and variables
2. Subscribe to product events (invoice created, due soon, grade posted)
3. Deliver via best available channel honoring preferences
4. Track opens/clicks/deliveries; retry failures

### Scope
- MVP
  - Email + SMS + In‑app delivery
  - Templates with variables and localization
  - Event triggers and simple schedules
  - Preferences (opt‑in/out, quiet hours)
  - Delivery logs and status webhooks
- Next (v2+)
  - Mobile push, WhatsApp (regional compliance)
  - Segments and A/B testing for templates
  - Attachment support and rich media

### Key User Stories
- As an Admin, I create localized templates with variables, so that messages are consistent.
  - Acceptance: Preview with sample data; validation; versioning.
- As an Admin, I configure event rules (e.g., invoice.created), so that messages send automatically.
  - Acceptance: Rule test mode, throttling windows, error hooks.
- As a Parent, I set channel preferences and quiet hours, so that I control how/when I’m notified.
  - Acceptance: Per‑event toggles; override for critical alerts.
- As Staff, I send class announcements, so that students/parents get timely information.
  - Acceptance: Class/segment targeting, attachment (v2), delivery summary.
- As an Admin, I see delivery analytics, so that I can improve templates.
  - Acceptance: Bounce/failed reasons, provider latency, open/click (email).

### Acceptance Criteria (Epic‑level)
- End‑to‑end event to delivery latency p95 < 10s
- Opt‑out respected across all channels
- Regional template IDs applied for SMS as required

### Dependencies
- User/roster data from Education Content module
- Payment module events for finance‑related reminders

### Risks & Mitigations
- Provider outages → Multi‑provider fallback (v2), queue retries
- SMS DLT/template rejection → Pre‑approval workflow and monitoring

### Non‑Functional Requirements
- Security: PII minimization, signed callback URLs
- Reliability: Durable queue with retry/backoff; at‑least‑once delivery semantics
- Observability: Per‑message event timeline; channel KPIs

### Success Metrics
- Delivery success rate ≥ 98%
- Opt‑out rate < 2% on transactional
- Latency p95 < 10s from event

---

## 3) Full Education Content Module Epic

### Epic Summary
Manage the end‑to‑end academic content lifecycle: curriculum mapping, courses, lessons, media, assignments, assessments, grading, and progress tracking.

### Business Value
- Centralizes academic content and reduces duplication
- Improves learning outcomes via structured, discoverable materials
- Streamlines teacher workflows and reporting

### Goals
- Curriculum to course mapping with outcomes
- Lesson planning with rich media and resources
- Assignments and assessments with grading workflows
- Progress tracking for students and visibility for parents

### Non‑Goals (initial)
- Full LMS marketplace or external course sales
- Complex proctoring beyond basic integrity tools

### Users & Personas
- Academic Admin: Sets curriculum and standards
- Teacher: Creates lessons, assignments, assessments
- Student: Consumes content, submits work
- Parent: Monitors progress and feedback

### Assumptions & Constraints
- Media storage via cloud object storage; CDN for delivery
- Standards mapping optional (e.g., CBSE/ICSE/local)

### High‑Level Workflow
1. Define curriculum, subjects, and outcomes
2. Create courses, units, lessons, and resources
3. Assign work and assessments; collect submissions
4. Grade and release feedback; track progress

### Scope
- MVP
  - Curriculum, course, unit, lesson structure
  - Rich content: text, images, files, links, embedded video
  - Assignments with due dates; basic rubric; file upload
  - Quizzes with MCQ/short answer; auto‑grading where possible
  - Gradebook and progress overview; parent portal read‑only
- Next (v2+)
  - Advanced question types; banks and randomization
  - Group work, peer review
  - Standards/outcomes mastery reports
  - Content versioning and reuse templates

### Key User Stories
- As an Academic Admin, I map curriculum outcomes to courses and units, so that alignment is trackable.
  - Acceptance: Outcome tags; coverage reporting.
- As a Teacher, I create lessons with text, media, and links, so that students access materials in one place.
  - Acceptance: WYSIWYG editor; media upload; preview.
- As a Teacher, I assign homework with due dates and rubrics, so that grading is consistent.
  - Acceptance: Submission types; late rules; rubric scoring.
- As a Student, I submit assignments from web/mobile, so that I meet deadlines.
  - Acceptance: File size/type checks; confirmation receipt.
- As a Teacher, I build quizzes with auto‑graded questions, so that quick feedback is possible.
  - Acceptance: Question bank; randomized order; timer (optional).
- As a Teacher, I grade and release feedback, so that students and parents see progress.
  - Acceptance: Draft vs published grades; bulk release; comments.
- As a Parent, I view my child’s progress and upcoming work, so that I can support them.
  - Acceptance: Read‑only; privacy scoping per child; notification hooks.

### Acceptance Criteria (Epic‑level)
- Content editor supports autosave and version history (v2)
- Gradebook exports to CSV and PDF
- Accessibility: WCAG AA for content consumption

### Dependencies
- Notification module for assignment and grade updates
- Storage/CDN and authentication/authorization

### Risks & Mitigations
- Large media → Transcoding and CDN; upload limits with resumable uploads
- Academic integrity → Plagiarism checks and originality reports (via AI module in v2)

### Non‑Functional Requirements
- Security: Fine‑grained access (student/teacher/parent), private resources
- Reliability: Autosave and draft recovery for editors
- Performance: Lesson load p95 < 2s with CDN
- Observability: Audit logs for content edits and grade changes

### Success Metrics
- Weekly active teacher creators +30%
- On‑time assignment submission rate +20%
- Parent portal engagement 2x within 3 months

---

## 4) Universal Chat Assistant Epic

### Epic Summary
Provide a simple, site-wide chat assistant visible on all pages to help users understand what they can do and get to common actions faster. Advanced AI features are out of scope for now and can be revisited later.

### Business Value
- Improve learning outcomes with personalized paths
- Reduce teacher workload on repetitive tasks
- Proactively support at‑risk students

### Goals
- Recommendation engine for content and practice
- Tutor assistant for Q&A and explanations
- Grading assistance and feedback drafting
- Predictive alerts (attendance, performance risk)

### Non‑Goals (initial)
- Fully autonomous grading without human review
- Proctoring and advanced identity verification

### Users & Personas
- Teacher: Uses AI to prepare, grade, and support students
- Student: Receives personalized practice and explanations
- Admin: Monitors impact and governs AI usage

### Assumptions & Constraints
- Privacy‑preserving data use; opt‑in where required
- Human‑in‑the‑loop for grading and critical decisions

### High‑Level Workflow
1. Collect learning and activity signals (privacy‑safe)
2. Generate recommendations and assistance on demand
3. Teacher reviews AI suggestions before publishing grades or plans
4. Monitor outcomes and adjust models/policies

### Scope
- MVP
  - Content/quiz recommendations based on course/grade and performance
  - Tutor assistant: guided hints, step‑by‑step explanations with citations to course content
  - Grading assistance for objective items; feedback drafts for subjective with rubric support
  - Early‑risk indicators from attendance and assignment trends
- Next (v2+)
  - Natural language content authoring aids with style/level control
  - Multilingual translation and summarization of lessons
  - Adaptive practice with spaced repetition

### Key User Stories
- As a Student, I receive recommended practice sets after a quiz, so that I can improve weak areas.
  - Acceptance: Recommendations explain “why”; difficulty adaptive; opt‑out available.
- As a Student, I ask the tutor assistant for help, so that I get step‑by‑step hints.
  - Acceptance: Grounded responses referencing course materials; safety filters.
- As a Teacher, I get suggested rubric scores and comment drafts, so that grading is faster but controlled.
  - Acceptance: Manual override; change log; no auto‑publish.
- As an Admin, I view AI impact dashboards, so that I ensure responsible usage.
  - Acceptance: Opt‑in rates, usage, outcome improvements; bias and drift alerts.

### Acceptance Criteria (Epic‑level)
- Grounding: ≥ 80% of assistant responses cite internal content
- Review: 100% teacher override available; no auto‑grade publish
- Privacy: Student PII never leaves approved boundaries; data retention controls

### Dependencies
- Education Content module for grounding data
- Notification module for nudges and tips
- Data platform for signals and metrics

### Risks & Mitigations
- Hallucinations → Retrieval‑augmented generation; strict guardrails; disclaimers
- Bias/drift → Evaluation sets; continuous monitoring; feedback loops
- Privacy concerns → Data minimization, consent, and access reviews

### Non‑Functional Requirements
- Security: Tenant‑isolated embeddings/indices where applicable
- Reliability: Fallbacks when AI unavailable; degrade gracefully
- Observability: Prompt/response logs with redaction; evaluation harnesses

### Success Metrics
- Teacher grading time reduced by 30%
- Student mastery improvement +10% in targeted units
- Tutor helpfulness CSAT ≥ 4.2/5

---

## Consolidated Roadmap (High‑Level)

- Phase 1 (Months 0–2):
  - Content MVP (structure, assignments, basic quizzes)
  - Notification MVP (email/SMS/in‑app, templates, events)
- Phase 2 (Months 2–4):
  - Payment MVP (invoices, checkout, receipts, basic reconciliation)
  - Notification enhancements (preferences, analytics)
- Phase 3 (Months 4–6):
  - Chat Assistant MVP (global launcher, context-aware links)
  - Content enhancements (gradebook, reports)
- Phase 4 (Months 6+):
  - Payment v2 (installments, discounts, multi‑PSP)
  - Notification v2 (push, segments)
  - Chat Assistant v2 (role-specific shortcuts, analytics)

Dependencies: Content → Notification; Payment → Notification; AI → Content (+ Data platform).

---

## Glossary

- PSP: Payment Service Provider
- DSO: Days Sales Outstanding
- RBAC: Role‑Based Access Control
- SLO: Service Level Objective
