FROM node:20.20.2-slim AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 4200
CMD ["npm", "run", "dev"]

FROM node:20.20.2-slim AS test
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src ./src
COPY Lib ./Lib
COPY test ./test
RUN npm test

FROM node:20.20.2-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]