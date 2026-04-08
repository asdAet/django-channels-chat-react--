#!/bin/sh
set -euf

: "${NGINX_CLIENT_MAX_BODY_SIZE:=5g}"
: "${NGINX_SERVER_NAMES:=_}"
: "${NGINX_PRIMARY_DOMAIN:=}"
: "${NGINX_SSL_CERT_PATH:=/etc/nginx/certs/fullchain.pem}"
: "${NGINX_SSL_KEY_PATH:=/etc/nginx/certs/privkey.pem}"
: "${NGINX_TLS_SYNC_INTERVAL_SECONDS:=60}"

tls_root="/var/lib/nginx/tls"
fallback_dir="${tls_root}/fallback"
active_dir="${tls_root}/active"
acme_dir="/var/www/certbot"

mkdir -p "${fallback_dir}" "${active_dir}" "${acme_dir}"

primary_domain="${NGINX_PRIMARY_DOMAIN}"
if [ -z "${primary_domain}" ]; then
  set -- ${NGINX_SERVER_NAMES}
  primary_domain="${1:-localhost}"
fi

fallback_cert_path="${fallback_dir}/fullchain.pem"
fallback_key_path="${fallback_dir}/privkey.pem"
active_cert_path="${active_dir}/fullchain.pem"
active_key_path="${active_dir}/privkey.pem"
letsencrypt_cert_path="/etc/letsencrypt/live/${primary_domain}/fullchain.pem"
letsencrypt_key_path="/etc/letsencrypt/live/${primary_domain}/privkey.pem"

build_subject_alt_names() {
  san_entries=""

  for server_name in ${NGINX_SERVER_NAMES}; do
    case "${server_name}" in
      ""|"_")
        continue
        ;;
      *[!0-9.]*)
        san_entry="DNS:${server_name}"
        ;;
      *)
        san_entry="IP:${server_name}"
        ;;
    esac

    if [ -n "${san_entries}" ]; then
      san_entries="${san_entries},${san_entry}"
    else
      san_entries="${san_entry}"
    fi
  done

  for default_entry in "DNS:localhost" "DNS:nginx" "IP:127.0.0.1"; do
    if [ -n "${san_entries}" ]; then
      san_entries="${san_entries},${default_entry}"
    else
      san_entries="${default_entry}"
    fi
  done

  printf '%s' "${san_entries}"
}

ensure_fallback_certificate() {
  if [ -f "${fallback_cert_path}" ] && [ -f "${fallback_key_path}" ]; then
    return
  fi

  subject_alt_names="$(build_subject_alt_names)"
  echo "nginx-entrypoint: TLS certs not found, generating persistent fallback self-signed certificate" >&2
  openssl req \
    -x509 \
    -nodes \
    -newkey rsa:2048 \
    -keyout "${fallback_key_path}" \
    -out "${fallback_cert_path}" \
    -days 30 \
    -subj "/CN=${primary_domain}" \
    -addext "subjectAltName=${subject_alt_names}"
  chmod 600 "${fallback_key_path}"
}

choose_tls_source() {
  if [ -f "${NGINX_SSL_CERT_PATH}" ] && [ -f "${NGINX_SSL_KEY_PATH}" ]; then
    printf '%s\n%s\n' "${NGINX_SSL_CERT_PATH}" "${NGINX_SSL_KEY_PATH}"
    return
  fi

  if [ -f "${letsencrypt_cert_path}" ] && [ -f "${letsencrypt_key_path}" ]; then
    printf '%s\n%s\n' "${letsencrypt_cert_path}" "${letsencrypt_key_path}"
    return
  fi

  ensure_fallback_certificate
  echo "nginx-entrypoint: WARNING: real TLS certificate files were not found at ${NGINX_SSL_CERT_PATH} and ${NGINX_SSL_KEY_PATH}; using self-signed fallback certificate for internal HTTPS only. Public browsers and Google OAuth will fail until a trusted certificate is installed in deploy/certs or terminated by the external TLS proxy." >&2
  printf '%s\n%s\n' "${fallback_cert_path}" "${fallback_key_path}"
}

sync_active_certificate() {
  tls_source="$(choose_tls_source)"
  cert_source="$(printf '%s' "${tls_source}" | sed -n '1p')"
  key_source="$(printf '%s' "${tls_source}" | sed -n '2p')"

  changed=0
  if [ ! -f "${active_cert_path}" ] || ! cmp -s "${cert_source}" "${active_cert_path}"; then
    cp "${cert_source}" "${active_cert_path}"
    changed=1
  fi

  if [ ! -f "${active_key_path}" ] || ! cmp -s "${key_source}" "${active_key_path}"; then
    cp "${key_source}" "${active_key_path}"
    chmod 600 "${active_key_path}"
    changed=1
  fi

  [ "${changed}" -eq 1 ]
}

watch_tls_updates() {
  sleep "${NGINX_TLS_SYNC_INTERVAL_SECONDS}"

  while true; do
    if sync_active_certificate; then
      nginx -s reload >/dev/null 2>&1 || true
    fi
    sleep "${NGINX_TLS_SYNC_INTERVAL_SECONDS}"
  done
}

export NGINX_CLIENT_MAX_BODY_SIZE NGINX_SERVER_NAMES
envsubst '${NGINX_CLIENT_MAX_BODY_SIZE} ${NGINX_SERVER_NAMES}' \
  < /etc/nginx/nginx.conf.template \
  > /etc/nginx/nginx.conf

sync_active_certificate || true
watch_tls_updates &
