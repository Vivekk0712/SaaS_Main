# ADR 0004: Notifications — Twilio (WhatsApp) and Email

Status: Accepted

Context
- PRD calls for real‑time notifications via Email and WhatsApp with reliable delivery and templates.

Decision
- Use Twilio for WhatsApp messaging. For email, use SMTP with a provider (e.g., Twilio SendGrid or AWS SES) via the same Notification service abstraction.

Consequences
- Pros: Unified provider SDKs, high deliverability; WhatsApp Business API via Twilio reduces direct Meta integration overhead.
- Cons: Approval and template pre‑registration for WhatsApp; provider costs.

Implementation
- Notification service implements provider adapters: `whatsapp.twilio`, `email.smtp` (configurable for SendGrid/SES).
- Template storage with variables and locales; idempotent send requests; track delivery state.
- Rate limiting and retries with DLQ; fallbacks where appropriate.

Security
- Store API keys in Secrets Manager; restrict PII in message payloads; consent tracking for parents.

Operational Notes
- Monitor provider latency/error rates; alarms on bounce rates and WhatsApp throughput caps.

