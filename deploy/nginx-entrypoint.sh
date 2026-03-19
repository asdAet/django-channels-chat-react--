#!/bin/sh
set -eu

: "${NGINX_CLIENT_MAX_BODY_SIZE:=5g}"

envsubst '${NGINX_CLIENT_MAX_BODY_SIZE}' \
  < /etc/nginx/nginx.conf.template \
  > /etc/nginx/nginx.conf
