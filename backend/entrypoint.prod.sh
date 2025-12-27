#!/bin/sh
set -eu

# Check if migrations exist and have been applied
if [ -d ./prisma/migrations ] && [ "$(ls -A ./prisma/migrations || true)" ]; then
	npx prisma migrate deploy || echo "No migrations to apply"
else
	npx prisma db push
fi


# Making sure that Prisma client exists
if [ -f "/app/prisma/schema.prisma" ]; then
	npx prisma generate || true
fi

# Apply migrations in production
# npx prisma migrate deploy || echo "No migrations to apply"

echo "Starting production backend..."
exec npm run start

