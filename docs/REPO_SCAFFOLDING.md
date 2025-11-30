# Repo Scaffolding Plan (AWS + MongoDB + RabbitMQ + Twilio + Razorpay)

Monorepo structure with isolated services, shared packages, infra, and ops.

Top‑level
- `apps/`
  - `frontend-next/` Next.js app with role‑based routing (Admin/Accountant/Student/Teacher/Parent).
- `services/`
  - `auth-service/` JWT/OAuth, RBAC, users/roles.
  - `study-service/` classes, attendance, assignments, grades, circulars, diaries.
  - `notification-service/` templates, email/WhatsApp via Twilio + SMTP, queues, DLQ.
  - `payment-service/` invoices, Razorpay intents, webhooks, receipts.
  - `reporting-service/` read‑optimized aggregates and dashboards.
- `packages/`
  - `shared-types/` TypeScript types and API contracts.
  - `shared-config/` eslint, tsconfig, prettier, commit hooks.
  - `sdk-clients/` typed API clients per service.
- `infra/`
  - `terraform/` AWS VPC, EKS/ECS, S3, Amazon MQ (RabbitMQ), IAM, Secrets.
  - `k8s/` Helm charts per service (Deploy/Service/Ingress, HPA, ConfigMap/Secret).
  - `gateway/` Ingress/Nginx or APIGW+ALB configs; rate limits and JWT validation.
- `ops/`
  - `runbooks/` oncall, DLQ handling, webhook retries, backup/restore.
  - `dashboards/` metrics and alerts definitions.
- `docs/` architecture, ADRs, API docs.

Conventions
- Node.js + TypeScript for services; `pnpm` workspaces.
- 12‑factor env config; secrets in AWS Secrets Manager; `.env.example` without secrets.
- Health endpoints: `/healthz` (liveness), `/readyz` (readiness) per service.
- OpenAPI specs per service; contract tests between services and clients.

CI/CD Outline (GitHub Actions)
- PR: lint, typecheck, unit tests; build Docker images; SBOM + vuln scan.
- Main: push images to ECR; deploy via Helm to EKS (dev → stage → prod with approvals).

Environments
- `dev` (shared), `stage` (pre‑prod), `prod` (restricted). Feature flags for safe rollout.

Initial Tasks to Scaffold
- Initialize `pnpm` workspace and base `tsconfig`/`eslint`.
- Create service templates with Express, health routes, structured logging, OpenTelemetry.
- Add RabbitMQ connection wrapper with retries and topology bootstrap (exchanges/queues).
- Add MongoDB client with connection pooling and TLS defaults.
- Wire Notification provider adapters (Twilio WhatsApp, SMTP for email) behind an interface.
- Add Razorpay SDK integration and webhook verification middleware.

