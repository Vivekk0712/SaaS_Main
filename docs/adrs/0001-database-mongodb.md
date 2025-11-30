# ADR 0001: Database — MongoDB

Status: Accepted

Context
- Requirements include flexible schemas across students, classes, attendance, assignments, payments metadata, and notifications.
- Services own their data; need fast iteration, horizontal scaling, and PITR backups.

Decision
- Use MongoDB as the primary database for service data. Prefer MongoDB Atlas for managed operations, backups, and metrics.

Consequences
- Pros: Flexible schema evolution, rich querying and indexes, mature drivers for Node.js, Atlas ops simplicity.
- Cons: Cross-document transactions are limited; enforce service boundaries and avoid multi-service joins.

Implementation
- One database per service (Auth, Study, Notification, Payment, Reporting). Separate users/roles per DB.
- Use compound indexes for high‑cardinality queries (e.g., `attendance(studentId, date)`; `grades(studentId, term)`).
- Enable PITR; configure backups and retention; enforce TLS and SCRAM auth.
- Migration strategy: additive changes; background migrations for large collections.

Security
- Field‑level encryption for sensitive PII if required; encrypt at rest; restrict network access (VPC peering/private link).

Operational Notes
- Observability via Atlas metrics and alerts; slow query profiling in non‑prod; runbook for hot index rebuilds.

