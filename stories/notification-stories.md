# Notification Module — User Stories

Granular user stories for the Notification epic with acceptance criteria and Gherkin scenarios.

---

## NOTI-001 Create Localized Template
- Story: As an Admin, I create localized templates with variables so messages are consistent.
- Acceptance Criteria:
  - Variables validated; live preview with sample data; version history and rollback.
- Gherkin:
  - Given a new email template with locale en-IN
  - When I add variables {{student_name}} and preview
  - Then the preview renders correctly and I can save v1

## NOTI-002 Configure Providers
- Story: As an Admin, I connect channel providers and set rate limits.
- Acceptance Criteria:
  - Health checks pass; credentials stored securely; per-channel limits enforced.
- Gherkin:
  - Given SMS provider credentials
  - When I save and run a health check
  - Then status shows healthy and rate limit is applied

## NOTI-003 Event-driven Delivery
- Story: As an Admin, I map product events to templates for automatic sends.
- Acceptance Criteria:
  - Rules accept event keys; test mode available; throttle windows supported.
- Gherkin:
  - Given rule invoice.created → email template T1
  - When an invoice is created
  - Then a message is queued and delivered with event metadata

## NOTI-004 User Preferences & Quiet Hours
- Story: As a Parent, I set channel preferences and quiet hours.
- Acceptance Criteria:
  - Per-event toggles; quiet hours per timezone; emergency override for critical alerts.
- Gherkin:
  - Given my quiet hours 22:00–07:00
  - When a non-critical event occurs at 23:00
  - Then the message is deferred until after 07:00

## NOTI-005 Delivery Logging & Status
- Story: As an Admin, I view message status, provider IDs, and failure reasons.
- Acceptance Criteria:
  - Webhook updates; bounce codes captured; searchable logs.
- Gherkin:
  - Given a delivered SMS
  - When the provider posts a DLR webhook
  - Then the message status updates to delivered with providerRef

## NOTI-006 Analytics Dashboard
- Story: As an Admin, I review delivery success, latency, and open/click (email).
- Acceptance Criteria:
  - Charts by channel and time; CSV export; filters by event/template.
- Gherkin:
  - Given the last 7 days range
  - When I open the analytics dashboard
  - Then I see delivery rate, p95 latency, and open/click for emails

## NOTI-007 Class Announcement (Ad-hoc)
- Story: As Staff, I send a class announcement with attachments (v2).
- Acceptance Criteria:
  - Target classes/subgroups; attachment type limits; delivery summary.
- Gherkin:
  - Given a Grade 8 announcement
  - When I send to all parents
  - Then recipients receive via preferred channels and I see a summary

## NOTI-008 SMS Template Compliance
- Story: As an Admin, I assign regional template IDs to SMS.
- Acceptance Criteria:
  - Enforces DLT/registry IDs before send; rejects non-compliant messages.
- Gherkin:
  - Given an SMS template without a DLT ID
  - When I attempt to activate it
  - Then the system blocks activation and prompts for a valid ID

## NOTI-009 Retry & Fallback
- Story: As the system, I retry failed sends and optionally fallback to another provider (v2).
- Acceptance Criteria:
  - Exponential backoff; max attempts; failover rules per channel.
- Gherkin:
  - Given an email provider outage
  - When sends fail with 5xx
  - Then retries are scheduled and failover provider is used after threshold

## NOTI-010 Respect Opt-outs
- Story: As a Parent, I opt out of non-critical notifications.
- Acceptance Criteria:
  - Opt-out respected across channels; critical overrides only for emergencies.
- Gherkin:
  - Given I opted out of content.assignment.reminder
  - When a reminder event occurs
  - Then I do not receive the message on any channel

