FROM node:20.20.2-slim AS dependencies
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:20.20.2-slim AS build
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/src ./src
RUN npm run build

FROM gcr.io/distroless/nodejs20-debian12 AS production
WORKDIR /app
ENV NODE_ENV=production
LABEL org.opencontainers.image.title="Servicios Médicos Backend"
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY backend/package.json ./package.json
EXPOSE 3000
CMD ["dist/index.js"]
