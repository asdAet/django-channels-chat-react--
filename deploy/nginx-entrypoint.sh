#!/bin/sh
set -eu

: "${NGINX_CLIENT_MAX_BODY_SIZE:=0}"

envsubst '${NGINX_CLIENT_MAX_BODY_SIZE}' \
  < /etc/nginx/nginx.conf.template \
  > /etc/nginx/nginx.conf
