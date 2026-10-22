FROM node:24-alpine AS build

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
COPY shared/ /shared/
RUN npm run build -- --configuration production,docker

FROM nginxinc/nginx-unprivileged:alpine

COPY frontend/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 8080
