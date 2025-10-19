#!/bin/sh
set -eu

if [ -f /app/.env ]; then
  export $(grep -v '^#' /app/.env | xargs)
fi

# Ensure Prisma client exists
npx prisma generate

# Apply migrations (if any). For SQLite you can use migrate deploy.
if npx prisma migrate status >/dev/null 2>&1; then
  echo "Running migrations..."
  npx prisma migrate deploy || true
fi

# Seed the DB (only if you have a prisma seed configured)
if [ -f /app/prisma/seed.ts ] || [ -f /app/prisma/seed.js ]; then
  echo "Seeding DB..."
  npx prisma db seed || true
fi

# Start the compiled Node app
echo "Starting backend..."
exec npm run dev

