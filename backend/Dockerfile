FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node server.js auth.js auth.routes.js events.routes.js ./
COPY --chown=node:node services ./services

USER node

EXPOSE 3001
CMD ["node", "server.js"]
