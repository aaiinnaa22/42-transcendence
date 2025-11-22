#############################
#	BASE STAGE				#
#############################
FROM node:20-alpine AS base

WORKDIR /app

# Check and install necessary dependencies
COPY package*.json ./
RUN npm install

#############################
#	DEVELOPMENT STAGE		#
#############################
FROM base AS development

# Sources are mounted in this stage

# Copy Prisma configuration
COPY prisma.config.dev.ts ./prisma.config.ts

# Entrypoint script
COPY entrypoint.dev.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 4241 5555

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

#############################
#	PRODUCTION STAGE		#
#############################
FROM base AS production

# Copy source files
COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./

# Data directory for SQLite
RUN mkdir -p /data && chmod 777 /data

# Generate prisma client, run build
RUN npx prisma generate || true

# Entrypoint script
COPY entrypoint.prod.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 4241

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

