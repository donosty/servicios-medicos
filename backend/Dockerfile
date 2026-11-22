FROM node:20.20.2-slim AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:20.20.2-slim AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM node:20.20.2-slim AS test
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src ./src
COPY test ./test
RUN npm test

FROM node:20.20.2-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM gcr.io/distroless/nodejs20-debian12 AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./package.json

EXPOSE 3000
CMD ["dist/index.js"]