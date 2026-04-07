#!/usr/bin/env bash
set -o errexit

# ── Build React frontend ──────────────────────────────────────────
cd ../frontend
npm install
npm run build

# ── Copie du build dans Django ────────────────────────────────────
cd ../backend
rm -rf frontend_build
cp -r ../frontend/dist frontend_build

# ── Backend ───────────────────────────────────────────────────────
pip install -r requirements.txt
python manage.py collectstatic --no-input
