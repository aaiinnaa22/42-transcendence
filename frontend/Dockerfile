#############################
#	BASE STAGE				#
#############################
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

#############################
#	DEVELOPMENT STAGE		#
#############################
FROM base AS development

 # Copy settings
COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY vite.config.ts postcss.config.js ./

# Copy sources
COPY public ./public
COPY index.html ./

EXPOSE 8080

CMD ["npm", "run", "dev"]

#############################
#	DEVELOPMENT STAGE		#
#############################
FROM base AS production

# NOTE: Adjust this stage for a production environment

 # Copy settings
COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY vite.config.ts postcss.config.js ./

# Copy sources
COPY src ./src
COPY public ./public
COPY index.html ./

EXPOSE 8080

CMD ["npm", "run", "dev"]
