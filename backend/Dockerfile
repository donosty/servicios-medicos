FROM node:20.20.2 AS base
WORKDIR /app
COPY package*.json ./

FROM base AS development
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

FROM node:20.20.2 AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]