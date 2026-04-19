/**
 * PM2: корректные cwd для монорепо (иначе next start ищет .next не там → 502 у Nginx).
 * Первый запуск: из корня репозитория на VPS
 *   pm2 start ecosystem.config.cjs
 * Обновление: pm2 restart ecosystem.config.cjs
 */
const path = require("node:path");

const repo = __dirname;

module.exports = {
  apps: [
    {
      name: "startuphub-api",
      cwd: path.join(repo, "server"),
      script: "npm",
      args: "run start",
      interpreter: "none",
      env: { NODE_ENV: "production" },
    },
    {
      name: "startuphub-web",
      cwd: path.join(repo, "client"),
      script: "npm",
      args: "run start",
      interpreter: "none",
      env: { NODE_ENV: "production", PORT: "3000" },
    },
  ],
};
