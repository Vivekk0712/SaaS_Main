#!/usr/bin/env bash
set -euo pipefail

# Ensures schema is applied and dummy + academics data are seeded.

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required to run seeding scripts. Install Node 18+." >&2
  exit 1
fi

: "${DATABASE_URL:=${DB_URL:-mysql://sas_app:9482824040@127.0.0.1:3306/sas}}"
export DATABASE_URL

echo "Using DATABASE_URL=${DATABASE_URL}"

echo "Applying schema from docs..."
node apps/frontend-next/scripts/apply-schema-from-doc.mjs

echo "Seeding master tables..."
node apps/frontend-next/scripts/seed-master.mjs

echo "Seeding dummy students/parents/teachers..."
node apps/frontend-next/scripts/seed-dummy.mjs

echo "Seeding academics data..."
node apps/frontend-next/scripts/seed-academics.mjs

echo "Seeding parent auth (password 12345)..."
node apps/onboarding-next/scripts/seed-parent-auth.mjs

echo "Validating tables..."
node apps/frontend-next/scripts/validate-db.mjs || true

echo "Done."
