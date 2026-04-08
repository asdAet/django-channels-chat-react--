#!/bin/sh
set -eu

: "${NGINX_CLIENT_MAX_BODY_SIZE:=5g}"
: "${NGINX_SSL_CERT_PATH:=/etc/nginx/certs/fullchain.pem}"
: "${NGINX_SSL_KEY_PATH:=/etc/nginx/certs/privkey.pem}"

if [ ! -f "${NGINX_SSL_CERT_PATH}" ] || [ ! -f "${NGINX_SSL_KEY_PATH}" ]; then
  fallback_dir="/tmp/nginx-certs"
  mkdir -p "${fallback_dir}"
  NGINX_SSL_CERT_PATH="${fallback_dir}/fullchain.pem"
  NGINX_SSL_KEY_PATH="${fallback_dir}/privkey.pem"

  if [ ! -f "${NGINX_SSL_CERT_PATH}" ] || [ ! -f "${NGINX_SSL_KEY_PATH}" ]; then
    echo "nginx-entrypoint: TLS certs not found, generating temporary self-signed certificate" >&2
    openssl req \
      -x509 \
      -nodes \
      -newkey rsa:2048 \
      -keyout "${NGINX_SSL_KEY_PATH}" \
      -out "${NGINX_SSL_CERT_PATH}" \
      -days 7 \
      -subj "/CN=localhost" \
      -addext "subjectAltName=DNS:localhost,DNS:nginx,IP:127.0.0.1"
  fi

  export NGINX_SSL_CERT_PATH NGINX_SSL_KEY_PATH
fi

envsubst '${NGINX_CLIENT_MAX_BODY_SIZE} ${NGINX_SSL_CERT_PATH} ${NGINX_SSL_KEY_PATH}' \
  < /etc/nginx/nginx.conf.template \
  > /etc/nginx/nginx.conf
