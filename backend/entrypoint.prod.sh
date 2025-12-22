#!/bin/sh
set -eu

# Making sure that Prisma client exists
if [ -f "/app/prisma/schema.prisma" ]; then
	npx prisma generate || true
fi

# Apply migrations in production
npx prisma migrate deploy || echo "No migrations to apply"

echo "Starting production backend..."
exec npm run start

