#!/bin/sh
set -eu

export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

if [ -f /app/.env ]; then
  export $(grep -v '^#' /app/.env | xargs)
fi

# Making sure that Prisma client exists
npx prisma generate

# Apply migrations or create the initial migration if none exist
if [ ! -d "/app/prisma/migrations" ] || [ -z "$(ls -A /app/prisma/migrations 2>/dev/null)" ]; then
	echo "Creating initial migration"
	npx prisma migrate dev --name init --skip-seed
else
	npx prisma migrate dev --name "migration_$(date +%Y%m%d_%H%M%S)" --skip-seed || echo "Migrations skipped..."
fi

SEED_MARKER="/app/prisma/.seeded"

echo "Checking if database is seeded..."
DB_ALREADY_SEEDED=false

if npx prisma db execute --stdin >/dev/null 2>&1 <<EOF
SELECT 1 FROM "User" LIMIT 1;
EOF
then
  DB_ALREADY_SEEDED=true
fi

# Seeding if 1. seed file exists 2. marker file doesn't exist 3. db is empty
if { [ -f /app/prisma/seed.ts ] || [ -f /app/prisma/seed.js ]; } \
  && [ ! -f "$SEED_MARKER" ] \
  && [ "$DB_ALREADY_SEEDED" = "false" ]; then
    echo "Seeding database..."
    if npx prisma db seed; then
      echo "Seed successful — marking as seeded."
      touch "$SEED_MARKER"
    else
      echo "Seeding failed or skipped."
    fi
else
  echo "Database already seeded — skipping."
fi

echo "Starting backend..."
exec npm run dev

