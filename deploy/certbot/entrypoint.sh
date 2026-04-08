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

is_ip_identifier() {
  case "${1}" in
    *:*)
      return 0
      ;;
    *[!0-9.]*|'')
      return 1
      ;;
    *.*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

identifiers="$(normalize_domains)"
if [ -z "${identifiers}" ]; then
  echo "certbot-entrypoint: TLS_DOMAINS is empty, automatic certificate issuance is disabled" >&2
  exec tail -f /dev/null
fi

set -- ${identifiers}
primary_domain="${CERTBOT_PRIMARY_DOMAIN}"
if [ -z "${primary_domain}" ]; then
  primary_domain="${1}"
fi

identifier_mode=""
for identifier in "$@"; do
  current_mode="domain"
  if is_ip_identifier "${identifier}"; then
    current_mode="ip"
  fi

  if [ -z "${identifier_mode}" ]; then
    identifier_mode="${current_mode}"
  elif [ "${identifier_mode}" != "${current_mode}" ]; then
    echo "certbot-entrypoint: mixed domain and IP identifiers are not supported in one certificate order" >&2
    exit 1
  fi
done

if [ -z "${identifier_mode}" ]; then
  echo "certbot-entrypoint: no certificate identifiers were provided" >&2
  exit 1
fi

primary_mode="domain"
if is_ip_identifier "${primary_domain}"; then
  primary_mode="ip"
fi

if [ "${primary_mode}" != "${identifier_mode}" ]; then
  echo "certbot-entrypoint: CERTBOT_PRIMARY_DOMAIN must match the identifier type from TLS_DOMAINS" >&2
  exit 1
fi

has_primary_identifier=0
for identifier in "$@"; do
  if [ "${identifier}" = "${primary_domain}" ]; then
    has_primary_identifier=1
    break
  fi
done

if [ "${has_primary_identifier}" -eq 0 ]; then
  set -- "${primary_domain}" "$@"
fi

build_domain_args() {
  if [ "${identifier_mode}" = "ip" ]; then
    printf -- ' --preferred-profile shortlived --ip-address %s' "${primary_domain}"
  else
    printf -- ' -d %s' "${primary_domain}"
  fi

  for identifier in "$@"; do
    if [ "${identifier}" = "${primary_domain}" ]; then
      continue
    fi

    if [ "${identifier_mode}" = "ip" ]; then
      printf -- ' --ip-address %s' "${identifier}"
    else
      printf -- ' -d %s' "${identifier}"
    fi
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
