# ADR 0002: Messaging — RabbitMQ

Status: Accepted

Context
- PRD requires asynchronous notifications and inter‑module communication, retries, DLQ, and fault isolation.

Decision
- Use RabbitMQ for messaging. Prefer Amazon MQ (RabbitMQ engine) for managed operations; alternatively deploy a RabbitMQ cluster on EKS.

Consequences
- Pros: Simple routing (direct/topic), mature retry/DLQ patterns, wide operator familiarity.
- Cons: Not a distributed log like Kafka; limited event replay; use per‑service outbox if replay needed.

Implementation
- Define queues for: `study.grade.published`, `study.circular.published`, `attendance.recorded`, `notification.requested`, `notification.sent|failed`, `payment.intent.created|completed|failed`.
- Establish DLQs with dead‑letter exchanges; implement exponential backoff.
- Ensure consumer idempotency using dedupe keys and processed message store.
- Use the Outbox pattern in services that publish events after DB commits.

Security
- TLS for AMQP connections; per‑service credentials with least privilege.

Operational Notes
- Dashboards for queue depth and consumer lag; alarms on DLQ growth and retry exhaustion.

