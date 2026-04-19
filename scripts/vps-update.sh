#!/usr/bin/env bash
# На VPS: подтянуть репозиторий, зависимости, миграции, сборка, перезапуск процессов.
#
# На сервере: export APP_DIR=/var/www/startuphub при необходимости, затем ./scripts/vps-update.sh
# Если «Permission denied»: chmod +x scripts/vps-update.sh (или git pull после коммита с правом +x на файл)
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

echo "Готово. PM2: сначала pm2 list, потом pm2 restart 0 или pm2 restart имя_процесса (подставь свой id/имя, не копируй многоточие)."
