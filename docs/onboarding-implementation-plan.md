# Onboarding Implementation Plan

This plan explains how the new Student Onboarding module integrates with existing services and keeps separate logins for Parent, Admissions, Principal, and Accountant.

## Components
- `services/onboarding-service/` Express API for onboarding flows (public + staff routes)
- `apps/frontend-next/` dedicated pages:
  - Parent: `/onboarding/signup`, `/onboarding/login`, `/onboarding/application`
  - Staff: `/admissions/login`, `/principal/login`, `/accountant/login`
- `services/auth-service/` remains the single source of tokens; we will call it next to replace the demo sessions.

## Auth & Separation
- Separate login pages and endpoints per role, but a single auth backend.
- JWT claims will carry `role` and (for staff) `department`/`permissions`.
- Cookies: HTTP‑only `sas_session` for all roles; frontend uses role‑aware route guards.

### Proposed Auth Endpoints (auth-service)
- `POST /v1/auth/parent/signup { phone, name, password } -> { otpToken }`
- `POST /v1/auth/parent/verify { otpToken, otp } -> { token }`
- `POST /v1/auth/parent/login { phone, password } -> { token }`
- `POST /v1/auth/staff/login { email, password, role } -> { token }` where role ∈ `admissions|principal|accountant`

## Onboarding API (implemented as stubs)
- `POST /v1/onboarding/public/signup`
- `POST /v1/onboarding/public/login`
- `POST /v1/onboarding/applications?action=submit`
- `POST /v1/onboarding/applications/:id/review`
- `POST /v1/onboarding/applications/:id/fees`
- `POST /v1/onboarding/applications/:id/approve`
- `POST /v1/onboarding/applications/:id/payment-link`
- Events: `roster.assignment.requested`, `roster.assignment.completed`

## Data & Failover
- Use the contracts in `docs/erp-onboarding-data-contract.md` with `externalId` and idempotent upserts.
- If ERP or Payments are down, persist locally and retry via queue.

## Next Steps to Productionize
1. Implement auth-service endpoints above; issue JWTs with `role` claim.
2. Replace demo sessionStorage with cookie auth in Next middleware and route guards per role.
3. Back the onboarding-service with Mongo collections: `applications`, `parents`, `files`, `feeDrafts`, `decisions`.
4. Integrate payment-service to generate hosted links and handle webhooks.
5. Integrate notification-service to deliver app/email/WhatsApp messages.
6. Add uploader using signed URLs (S3/GCS) via shared-lib.
7. Add HOD integration: publish `roster.assignment.requested`, consume `roster.assignment.completed`.

## Routing Summary
- Parent journey: `/onboarding/signup -> /onboarding/login -> /onboarding/application`
- Admissions: `/admissions/login -> admin dashboard -> onboarding review screens`
- Principal: `/principal/login -> admin dashboard with approvals`
- Accountant: `/accountant/login -> accountant dashboard (fees/installments)`

