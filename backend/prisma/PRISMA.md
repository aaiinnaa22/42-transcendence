# Prisma Setup Instructions

This document provides step-by-step instructions for setting up and managing the Prisma database for the 42-transcendence backend.

## Prerequisites

- Node.js installed
- npm/yarn package manager
- Environment variables configured (`.env` file)

## Initial Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Make sure your `.env` file contains:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-jwt-secret-here"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:4241/auth/google/callback"
```

### 3. Database Setup
```bash
# Apply the Prisma schema to create tables
npx prisma db push

# Seed the database with initial data
npx prisma db seed
```

## Database Management Commands

### Schema Management
```bash
# Apply schema changes to database
npx prisma db push

# Generate Prisma Client after schema changes
npx prisma generate

# Reset database (WARNING: Deletes all data)
npx prisma db push --force-reset
```

### Data Management
```bash
# Seed database with test data
npx prisma db seed

# View database in browser
npx prisma studio

# View database in terminal
npx prisma studio --port 5556
```

### Development Workflow
```bash
# 1. Make changes to schema.prisma
# 2. Apply changes to database
npx prisma db push

# 3. Generate new Prisma Client
npx prisma generate

# 4. Restart your development server
npm run dev
```

## Database Schema

### Current Models
- **User**: User accounts with Google OAuth integration
- **PlayerStats**: Gaming statistics (wins, losses, ELO rating)

### Key Features
- SQLite database for development
- UUID primary keys
- Automatic timestamps (createdAt, updatedAt)
- Google OAuth integration
- Player statistics tracking

## Troubleshooting

### Common Issues

1. **"Table does not exist" error**
   ```bash
   npx prisma db push
   ```

2. **"Prisma Client not generated" error**
   ```bash
   npx prisma generate
   ```

3. **Database connection issues**
   - Check `.env` file for correct `DATABASE_URL`
   - Ensure `dev.db` file exists in `prisma/` directory

4. **Schema changes not applied**
   ```bash
   npx prisma db push --force-reset
   npx prisma db seed
   ```

### Reset Everything
```bash
# Delete database and recreate
rm prisma/dev.db
npx prisma db push
npx prisma db seed
```

## Production Setup

For production deployment:

1. **Change database URL** in `schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. **Set production environment variables**:
   ```env
   DATABASE_URL="your-production-database-url"
   ```

3. **Apply schema**:
   ```bash
   npx prisma db push
   ```

## Useful Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
