#!/usr/bin/env bash
# На VPS: подтянуть репозиторий, зависимости, миграции, сборка, перезапуск процессов.
#
# Один раз на сервере:
#   chmod +x scripts/vps-update.sh
#   export APP_DIR=/home/USER/StartupHUB   # путь к клону репозитория
#   ./scripts/vps-update.sh
#
# Перед первым запуском задай .env в корне репозитория (DATABASE_URL, JWT_SECRET, NODE_ENV=production, CORS_ORIGIN и т.д.).

set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/StartupHUB}"
cd "$APP_DIR"

echo ">>> git pull"
git pull --ff-only

echo ">>> npm ci (database, server, client)"
npm ci --prefix database
npm ci --prefix server
npm ci --prefix client

echo ">>> prisma migrate deploy"
npm --prefix database exec prisma migrate deploy

echo ">>> prisma generate"
npm --prefix database exec prisma generate

echo ">>> build server"
npm --prefix server run build

echo ">>> build client"
npm --prefix client run build

echo ">>> перезапуск приложений (настрой под себя)"
# Примеры — раскомментируй и подставь свои имена из `pm2 list`:
# pm2 restart startuphub-api
# pm2 restart startuphub-client
#
# Если без pm2 — перезапусти systemd-сервисы или screen/tmux вручную:
# NODE_ENV=production node server/dist/index.js
# npm --prefix client run start

echo "Готово."
