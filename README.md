School SAS Monorepo

This repo contains the School SAS services and apps.

Tech choices: MongoDB, RabbitMQ, AWS, Twilio (WhatsApp), Razorpay.

Quick start

Install Node 18+.

npm install (may require network access).

npm run dev to run all services in dev once dependencies are installed.

Structure

apps/ Next.js frontend (placeholder)

services/ Node/TS microservices (auth, study, notification, payment, reporting)

packages/ shared libs and configs

infra/ k8s/terraform placeholders

docs/ architecture and ADRs

Student Onboarding (Separate Website)

New site: apps/onboarding-next (Next.js) for parent signup/login and application flow.

Backend API: services/onboarding-service (Express) shares the same DB via packages/shared-lib.

Main school site stays in apps/frontend-next. Each app is independent; if one stops, others keep running.

Run everything with one command

Optional env (local defaults used if unset):

MONGODB_URI (default mongodb://localhost:27017/school-sas)

RABBITMQ_URL (default amqp://localhost:5672)

STUDY_API_URL (default http://localhost:3002)

NEXT_PUBLIC_ONBOARDING_API_URL (default http://localhost:3005)

Start stack: npm run dev:stack

Starts: study-service:3002, onboarding-service:3005, frontend-next:3000, onboarding-next:3020

Include admissions demo too: WITH_ADMISSIONS=1 npm run dev:stack

Data reset for fresh testing

Wipe both onboarding and study (SAS) data: node scripts/wipe-all.mjs

Requires onboarding principal headers (added by the script): x-role: principal, x-password: 12345.

Endpoints invoked:

Onboarding: DELETE /v1/onboarding/staff/admin/wipe

Study: DELETE /v1/admin/wipe

Auto-assign to CLASS 1

Upon admissions confirmation, the onboarding service creates the student directly in the Study (SAS) DB via POST /v1/students.

If the grade is 1 or CLASS 1, the student is auto-assigned to CLASS 1.

If no CLASS 1 class exists, the study service creates a default CLASS 1 section A automatically.
