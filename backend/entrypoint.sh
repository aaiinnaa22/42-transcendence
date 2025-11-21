#!/bin/sh
set -eu

if [ -f /app/.env ]; then
  export $(grep -v '^#' /app/.env | xargs)
fi

# Making sure that Prisma client exists
npx prisma generate

# Applying migrations if they exist
echo "Running migrations..."
npx prisma migrate deploy || echo "Migration step skipped (no migrations found)."

# Seeding basics into the database
if [ -f /app/prisma/seed.ts ] || [ -f /app/prisma/seed.js ]; then

  # Check if DB already appears seeded
  if npx prisma db execute --stdin >/dev/null 2>&1 <<EOF
SELECT 1 FROM "User" LIMIT 1;
EOF
  then
    echo "Database already seeded — skipping seed."
  else
    echo "Seeding database..."
    npx prisma db seed || echo "Seeding failed or skipped"
  fi

else
  echo "No seed file found, skipping..."
fi

echo "Starting backend..."
exec npm run dev

