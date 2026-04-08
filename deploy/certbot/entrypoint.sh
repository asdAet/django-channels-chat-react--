#!/bin/sh
set -euf

: "${CERTBOT_EMAIL:=}"
: "${CERTBOT_DOMAINS:=}"
: "${CERTBOT_PRIMARY_DOMAIN:=}"
: "${CERTBOT_STAGING:=0}"
: "${CERTBOT_RENEW_INTERVAL_SECONDS:=43200}"

normalize_domains() {
  printf '%s' "${CERTBOT_DOMAINS}" | tr ',' ' '
}

domains="$(normalize_domains)"
if [ -z "${domains}" ]; then
  echo "certbot-entrypoint: TLS_DOMAINS is empty, automatic certificate issuance is disabled" >&2
  exec tail -f /dev/null
fi

set -- ${domains}
primary_domain="${CERTBOT_PRIMARY_DOMAIN}"
if [ -z "${primary_domain}" ]; then
  primary_domain="${1}"
fi

has_primary_domain=0
for domain in "$@"; do
  if [ "${domain}" = "${primary_domain}" ]; then
    has_primary_domain=1
    break
  fi
done

if [ "${has_primary_domain}" -eq 0 ]; then
  set -- "${primary_domain}" "$@"
fi

build_domain_args() {
  printf -- ' -d %s' "${primary_domain}"
  for domain in "$@"; do
    if [ "${domain}" = "${primary_domain}" ]; then
      continue
    fi
    printf -- ' -d %s' "${domain}"
  done
}

domain_args="$(build_domain_args "$@")"
live_cert_path="/etc/letsencrypt/live/${primary_domain}/fullchain.pem"
live_key_path="/etc/letsencrypt/live/${primary_domain}/privkey.pem"

staging_arg=""
if [ "${CERTBOT_STAGING}" = "1" ]; then
  staging_arg="--staging"
fi

email_args="--register-unsafely-without-email"
if [ -n "${CERTBOT_EMAIL}" ]; then
  email_args="--email ${CERTBOT_EMAIL}"
else
  echo "certbot-entrypoint: TLS_LETSENCRYPT_EMAIL is empty, requesting certificate without registration email" >&2
fi

request_certificate() {
  certbot certonly \
    --webroot \
    -w /var/www/certbot \
    --cert-name "${primary_domain}" \
    --agree-tos \
    --no-eff-email \
    --non-interactive \
    --keep-until-expiring \
    --rsa-key-size 4096 \
    ${email_args} \
    ${staging_arg} \
    "$@"
}

if [ ! -f "${live_cert_path}" ] || [ ! -f "${live_key_path}" ]; then
  # shellcheck disable=SC2086
  request_certificate ${domain_args}
fi

while true; do
  certbot renew \
    --webroot \
    -w /var/www/certbot \
    --quiet \
    ${staging_arg} || true
  sleep "${CERTBOT_RENEW_INTERVAL_SECONDS}"
done
