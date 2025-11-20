#!/bin/sh
set -eu

export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

if [ -f /app/.env ]; then
  export $(grep -v '^#' /app/.env | xargs)
fi

# Making sure that Prisma client exists
npx prisma generate

# Apply migrations
npx prisma migrate dev || echo "Migrations skipped..."

# Seeding the development database
SEED_MARKER="/app/prisma/.seeded"

if { [ -f /app/prisma/seed.ts ] || [ -f /app/prisma/seed.js ]; } \
  && [ ! -f "$SEED_MARKER" ]; then
    echo "Seeding database..."
    npx prisma db seed && touch "$SEED_MARKER" || echo "Seeding failed or skipped"
  else
    echo "Database already seeded..."
fi

echo "Starting backend..."
exec npm run dev

