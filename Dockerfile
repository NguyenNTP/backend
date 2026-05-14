FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY . .

RUN mkdir -p public/uploads \
    && chown -R node:node /app

USER node

EXPOSE 5000

CMD ["node", "app.js"]
