FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . . 

EXPOSE 4545

ENV HOST=0.0.0.0
ENV PORT=4545

CMD ["node", "server.js"]