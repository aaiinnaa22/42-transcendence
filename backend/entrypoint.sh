#!/bin/sh
set -eu

if [ -f /app/.env ]; then
  export $(grep -v '^#' /app/.env | xargs)
fi

# Making sure that Prisma client exists
npx prisma generate

# Applying migrations if they exist
if npx prisma migrate status >/dev/null 2>&1; then
  echo "Running migrations..."
  npx prisma migrate deploy || true
fi

# Seeding basics into the database
if [ -f /app/prisma/seed.ts ] || [ -f /app/prisma/seed.js ]; then
  echo "Seeding DB..."
  npx prisma db seed || true
fi

echo "Starting backend..."
exec npm run dev

