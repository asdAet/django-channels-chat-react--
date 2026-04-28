#!/bin/sh
set -eu

: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
: "${POSTGRES_MONITORING_USER:?POSTGRES_MONITORING_USER is required}"
: "${POSTGRES_MONITORING_PASSWORD:?POSTGRES_MONITORING_PASSWORD is required}"

until pg_isready -h postgres -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do
  sleep 2
done

export PGPASSWORD="$POSTGRES_PASSWORD"

psql \
  -h postgres \
  -p 5432 \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  -v ON_ERROR_STOP=1 \
  -v monitoring_user="$POSTGRES_MONITORING_USER" \
  -v monitoring_password="$POSTGRES_MONITORING_PASSWORD" \
  -v database_name="$POSTGRES_DB" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'monitoring_user', :'monitoring_password')
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_roles
  WHERE rolname = :'monitoring_user'
) \gexec

SELECT format('ALTER ROLE %I WITH LOGIN PASSWORD %L', :'monitoring_user', :'monitoring_password') \gexec
SELECT format('GRANT pg_monitor TO %I', :'monitoring_user') \gexec
SELECT format('GRANT CONNECT ON DATABASE %I TO %I', :'database_name', :'monitoring_user') \gexec

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
SQL
