#!/usr/bin/env bash
set -euo pipefail

HOST="${DB_HOST:-127.0.0.1}"
PORT="${DB_PORT:-3306}"
echo "Waiting for MySQL at ${HOST}:${PORT} ..."
for i in {1..60}; do
  if nc -z "$HOST" "$PORT" 2>/dev/null; then
    echo "MySQL is up."
    exit 0
  fi
  sleep 2
done
echo "MySQL did not become ready in time." >&2
exit 1

