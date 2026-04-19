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

echo ">>> prisma migrate deploy (cwd: database/)"
( cd "$APP_DIR/database" && npx prisma migrate deploy )

echo ">>> prisma generate (cwd: database/)"
( cd "$APP_DIR/database" && npx prisma generate )

echo ">>> build server"
npm --prefix server run build

echo ">>> build client"
npm --prefix client run build
test -f "$APP_DIR/client/.next/BUILD_ID" || {
  echo "Ошибка: нет client/.next после сборки. Проверь логи выше."
  exit 1
}

echo "Готово. Перезапусти свои процессы (как у тебя уже настроено), например: pm2 restart <id или имя из pm2 list>"
