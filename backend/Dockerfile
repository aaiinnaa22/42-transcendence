FROM node:20-alpine

WORKDIR /app

#Check and install necessary dependencies
COPY package*.json ./
RUN npm install

COPY prisma ./prisma
COPY src ./src

#Data dir for SQLite
RUN mkdir -p /data && chmod 777 /data

#Generate prisma client, run build
RUN npx prisma generate || true

#entrypoint script
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 4241

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["npm", "run", "dev"]
