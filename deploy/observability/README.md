# Production Observability

Запуск observability-слоя поверх production compose:

```bash
docker compose -f docker-compose.prod.yml -f deploy/observability/compose.yml up --build -d
```

Стек поднимает:
- `Prometheus`
- `Alertmanager`
- `Grafana`
- `Loki`
- `Grafana Alloy`
- `node_exporter`
- `cAdvisor`
- `blackbox_exporter`
- `nginx-prometheus-exporter`
- `postgres_exporter`
- `redis_exporter`

Версии, зафиксированные в конфигурации:
- `Prometheus v3.11.1`
- `Alertmanager v0.31.1`
- `Grafana 12.4.2`
- `Loki 3.7.1`
- `Grafana Alloy v1.15.0`
- `node_exporter v1.11.1`
- `cAdvisor v0.56.2`
- `blackbox_exporter v0.28.0`
- `nginx-prometheus-exporter 1.5.1`
- `postgres_exporter v0.19.1`
- `redis_exporter v1.82.0`

Основные ограничения доступа:
- `Grafana` публикуется только на `127.0.0.1:${GRAFANA_PORT:-3000}`
- остальные observability-сервисы остаются только внутри Docker-сети
- backend метрики доступны только по внутреннему `http://backend:8000/metrics/`
- nginx status доступен только по внутреннему `http://nginx:8080/nginx_status`

Обязательные переменные окружения:
- `GRAFANA_ADMIN_PASSWORD`
- `POSTGRES_MONITORING_PASSWORD`

Опциональные переменные окружения:
- `GRAFANA_ADMIN_USER`
- `GRAFANA_PORT`
- `GRAFANA_ROOT_URL`
- `PROMETHEUS_RETENTION_TIME`
- `PROMETHEUS_RETENTION_SIZE`
- `ALERTMANAGER_TELEGRAM_BOT_TOKEN`
- `ALERTMANAGER_TELEGRAM_CHAT_ID`
- `POSTGRES_MONITORING_USER`
- `POSTGRES_LOG_MIN_DURATION_STATEMENT_MS`

Provisioned Grafana dashboards:
- `Platform Overview`
- `Edge And Runtime`
- `Data Services`
- `Application And Realtime`
- `Logs Overview`
