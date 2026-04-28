#!/bin/sh
set -eu

receiver_name="null"
telegram_receiver=""

if [ -n "${ALERTMANAGER_TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${ALERTMANAGER_TELEGRAM_CHAT_ID:-}" ]; then
  receiver_name="telegram"
  telegram_receiver=$(cat <<EOF
  - name: "telegram"
    telegram_configs:
      - bot_token: "${ALERTMANAGER_TELEGRAM_BOT_TOKEN}"
        chat_id: ${ALERTMANAGER_TELEGRAM_CHAT_ID}
        send_resolved: true
        message: '{{ template "telegram.devils.message" . }}'
EOF
)
fi

cat > /etc/alertmanager/alertmanager.yml <<EOF
global:
  resolve_timeout: 5m

templates:
  - "/etc/alertmanager/templates/*.tmpl"

route:
  receiver: "${receiver_name}"
  group_by: ["alertname", "service", "severity"]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    - matchers:
        - severity="critical"
      receiver: "${receiver_name}"
    - matchers:
        - severity="warning"
      receiver: "${receiver_name}"

inhibit_rules:
  - source_matchers:
      - severity="critical"
    target_matchers:
      - severity="warning"
    equal: ["alertname", "service", "instance"]

receivers:
  - name: "null"
${telegram_receiver}
EOF

exec /bin/alertmanager --config.file=/etc/alertmanager/alertmanager.yml --storage.path=/alertmanager
