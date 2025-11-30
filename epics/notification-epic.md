# Notification Module Epic — School SAS

## Summary
Deliver reliable, configurable multi-channel notifications (email, SMS, in-app, push v2) for transactional and scheduled school communications with preferences, compliance, and analytics.

## Vision & Objectives
- Ensure the right user gets the right message at the right time and channel.
- Respect user preferences and legal compliance while maximizing deliverability.
- Provide actionable analytics to improve templates and reduce noise.

## Scope
- In: Templates with variables and localization, event-driven and scheduled sends, preferences, delivery logs, analytics, retries, basic segments.
- Out (initial): Full marketing automation/CRM, complex campaigns, deep A/B suites.

## Personas
- Admin: Manages templates, policies, providers, and analytics.
- Teacher/Staff: Sends announcements to classes/segments.
- Parent/Student: Receives notifications and manages preferences.

## Assumptions
- Integrate with at least one provider per channel; regional SMS template approvals as required.
- Event bus available from core platform (or simple internal dispatcher in MVP).

## Functional Requirements
- MVP
  - Channels: Email, SMS, In-app.
  - Template system: variables, localization, preview, versioning.
  - Triggers: product events (invoice.created, assignment.posted), simple schedules.
  - Preferences: per-user, per-event toggles; quiet hours; critical overrides.
  - Delivery logs: status, provider IDs, bounce/fail reason.
  - Analytics: deliveries, opens/clicks (email), latency.
- Next (v2+)
  - Channels: Mobile push, WhatsApp (regional compliance).
  - Segments and light A/B; attachments and rich media.
  - Multi-provider routing and fallback.

## Detailed User Stories
- As an Admin, I create localized templates with variables so messages are consistent.
  - Acceptance: Live preview; linting; version history; rollback.
- As an Admin, I connect providers and set rules per channel.
  - Acceptance: Health checks; rate limits; credentials rotation reminders.
- As a Parent, I set preferences and quiet hours per event so I control my notifications.
  - Acceptance: UI with per-event toggles; emergency override for critical alerts.
- As Staff, I send a class announcement with attachments (v2).
  - Acceptance: Class and subgroup targeting; delivery summary.
- As an Admin, I review analytics and improve templates.
  - Acceptance: Bounce reasons; latency; open/click rates; export CSV.

## Workflows
1) Event capture → Template rendering → Channel selection (preferences) → Send → Delivery tracking.
2) Scheduled: Query segment → Render → Send window honoring quiet hours → Track.

## Data Model (Overview)
- Template(id, name, channel, locale, subject, body, variables[], version, active)
- Preference(id, userId, eventKey, allowedChannels[], quietHours, overrides)
- Message(id, eventKey, userId, channel, templateId, status, providerRef, sentAt, deliveredAt, error)
- ProviderConfig(id, channel, name, credentialsRef, rateLimit, status)
- EventLog(id, eventKey, payloadRef, createdAt)

## API Surface (Draft)
- POST /api/notify/templates
- GET /api/notify/templates/:id
- POST /api/notify/send (ad-hoc, staff announcements)
- POST /api/notify/events (ingest product events)
- POST /api/notify/webhooks/:provider (status callbacks)
- GET /api/notify/analytics?range=...
- GET /api/notify/preferences/:userId
- PUT /api/notify/preferences/:userId

## Integrations
- Email/SMS providers with signed callbacks; Firebase/FCM for push (v2); WhatsApp BSP (v2).

## Events & Notification Hooks
- payment.* (created, due_soon, overdue, succeeded, failed)
- content.* (assignment.posted, grade.published)
- system.* (policy.updated, maintenance.notice)

## Security, Privacy & Compliance
- PII minimization in payloads; encrypt at rest; signed callback URLs.
- Respect opt-in/out; store consent timestamps; regional SMS template IDs.

## Non-Functional Requirements
- Latency: Event to delivery p95 < 10s (transactional).
- Reliability: At-least-once delivery semantics; durable queues with backoff and DLQ.
- Observability: End-to-end message timeline; per-channel KPIs.

## Operations & Runbook
- Queue depth monitoring; bounce rate alarms; provider status checks.
- Failover plan for provider outages; rate limit enforcement.

## Dependencies
- User directory/roster from Education Content; events from Payment/Content modules.

## Risks & Mitigations
- Provider outages → Multi-provider and retries; clear UI status.
- SMS DLT rejections → Pre-approval workflow; regional compliance registry.

## Migration & Rollout
- Start with in-app + email; add SMS after template approvals; push in v2.

## Testing Strategy
- Template rendering snapshot tests; event-to-send integration tests; webhook auth tests.
- Load tests for burst sends (e.g., 10k parents in 5 min window).

## Metrics & KPIs
- Delivery success rate, latency p95, bounce rate, opt-out rate (transactional), provider error rate.

## Roadmap
- M0–M2: Email/SMS/In-app, templates, events, preferences, logs.
- M2–M4: Analytics dashboards, segments, attachments.
- M4+: Push and WhatsApp channels; multi-provider routing.

## Open Questions
- Quiet hours per timezone vs. per-tenant default?
- Parent-student relationship scoping for announcements?

## Glossary
- DLQ: Dead-letter queue. BSP: Business Solution Provider.

