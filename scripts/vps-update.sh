#!/usr/bin/env bash
# --- Выкладка (кратко) ---
# ПК:  git add -A && git commit -m "сообщение" && git push
# VPS: cd /var/www/startuphub && git pull && ./scripts/vps-update.sh
# VPS: pm2 list → перезапуск: pm2 restart ID_или_имя_API  и  ID_или_имя_WEB
#
# Почему ломался 502 после ручных команд: (1) фронт в PM2 должен стартовать из client/,
# иначе next start не видит client/.next; (2) в корневом .env часто PORT=4000 для API —
# Next раньше тоже лез на 4000 и падал; в client/package.json start теперь с -p 3000.
# Если web в pm2 list «errored» — один раз: cd client && pm2 delete ИМЯ && pm2 start npm --name ИМЯ -- run start
#
# Корень репо = каталог на уровень выше этого скрипта. Переопределение: export APP_DIR=/путь/к/клону
# Permission denied: chmod +x scripts/vps-update.sh
#
# Перед первым запуском: .env в корне репо (DATABASE_URL, JWT_SECRET, NODE_ENV=production, CORS_ORIGIN, …).

set -euo pipefail

_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
APP_DIR="${APP_DIR:-$(cd "$_SCRIPT_DIR/.." && pwd)}"
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

echo "Готово. PM2: pm2 list, затем pm2 restart 0 (или другое число/имя из таблицы). В bash не вводи угловые скобки < > — из-за них бывает «syntax error near unexpected token»."

if command -v curl >/dev/null 2>&1; then
  echo ">>> проверка локального фронта (Nginx часто проксирует на :3000)"
  _code="$(curl -sS --max-time 3 -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000" 2>/dev/null)" || _code="000"
  echo "    127.0.0.1:3000 -> HTTP ${_code} (000 = нет процесса — перезапусти PM2 для Next из client/; в nginx смотри свой proxy_pass)"
fi
