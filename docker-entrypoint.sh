#!/bin/bash
set -e

echo "==> Migrations..."
python manage.py migrate --no-input

echo "==> Seed (données initiales si besoin)..."
python manage.py seed || true

# ── Calcul automatique des workers selon les CPU disponibles ──────
# Formule : (2 x CPU) + 1, min 2, max 17
CPU_COUNT=$(nproc 2>/dev/null || echo 2)
AUTO_WORKERS=$(( CPU_COUNT * 2 + 1 ))
WORKERS=${GUNICORN_WORKERS:-$AUTO_WORKERS}
echo "==> CPU détectés : ${CPU_COUNT} — Workers Gunicorn : ${WORKERS}"

echo "==> Démarrage Gunicorn..."
exec gunicorn config.wsgi:application \
    --bind "0.0.0.0:${PORT:-8000}" \
    --workers "${WORKERS}" \
    --threads 2 \
    --timeout 30 \
    --keepalive 2 \
    --access-logfile - \
    --error-logfile -
