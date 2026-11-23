FROM node:20.20.2-slim AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/src ./src
COPY frontend/Lib ./Lib
COPY frontend/test ./test
RUN npm run build

FROM nginx:alpine AS production
LABEL org.opencontainers.image.title="Servicios Médicos Frontend"
COPY --from=builder /app/dist /usr/share/nginx/html
COPY deploy/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
