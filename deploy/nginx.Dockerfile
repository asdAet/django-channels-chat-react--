FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_GOOGLE_OAUTH_CLIENT_ID=""
ENV VITE_GOOGLE_OAUTH_CLIENT_ID=${VITE_GOOGLE_OAUTH_CLIENT_ID}
ARG VITE_YANDEX_METRIKA_ID=""
ENV VITE_YANDEX_METRIKA_ID=${VITE_YANDEX_METRIKA_ID}
ARG VITE_GOOGLE_TAG_ID=""
ENV VITE_GOOGLE_TAG_ID=${VITE_GOOGLE_TAG_ID}
ARG VITE_ENABLE_PWA="0"
ENV VITE_ENABLE_PWA=${VITE_ENABLE_PWA}

COPY frontend/package*.json ./frontend/
RUN npm ci --prefix frontend

COPY frontend ./frontend
RUN npm run build --prefix frontend

FROM nginx:1.25-alpine

RUN apk add --no-cache gettext openssl

COPY deploy/nginx.conf /etc/nginx/nginx.conf.template
COPY deploy/nginx-entrypoint.sh /docker-entrypoint.d/99-render-nginx-config.sh
RUN chmod +x /docker-entrypoint.d/99-render-nginx-config.sh
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80 443
