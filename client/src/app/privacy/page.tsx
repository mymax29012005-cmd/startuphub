"use client";

import React from "react";
import Link from "next/link";

import { Card } from "@/components/ui/Card";

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link href="/" className="text-[var(--accent)] hover:text-white text-sm font-medium">
          ← На главную
        </Link>
      </div>

      <Card className="p-6 md:p-10">
        <h1 className="text-2xl font-semibold text-white">Политика конфиденциальности StartupHub</h1>
        <div className="mt-2 text-xs text-[rgba(234,240,255,0.65)]">
          Дата вступления в силу: 15 апреля 2026 г. · Последнее обновление: 15 апреля 2026 г.
        </div>

        <div className="mt-6 space-y-5 text-sm text-[rgba(234,240,255,0.78)] leading-relaxed">
          <p>
            Эта Политика объясняет, какие данные обрабатываются на платформе StartupHub (далее — «Платформа»),
            зачем они нужны и как мы их защищаем.
          </p>

          <div className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)]">
            <div className="text-sm font-semibold text-white">1. Кто обрабатывает данные</div>
            <div className="mt-2">
              Оператор персональных данных — владелец Платформы StartupHub. По вопросам обработки данных можно
              написать на email из раздела «Контакты» внизу этой страницы.
            </div>
          </div>

          <div className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)]">
            <div className="text-sm font-semibold text-white">2. Какие данные мы обрабатываем</div>
            <div className="mt-2 space-y-3">
              <div>
                <div className="font-semibold text-white/90">2.1. Данные, которые вы вводите сами</div>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Имя, email и/или телефон, тип аккаунта (founder/investor/partner/buyer).</li>
                  <li>Данные профиля (например, аватар и описание), если вы их заполняете.</li>
                  <li>
                    Контент, который вы публикуете: карточки стартапов/идей/запросов, данные аукционов и ставок,
                    сообщения в чатах.
                  </li>
                  <li>
                    Файлы, которые вы прикрепляете (например PDF/презентации): имя файла, размер, тип и ссылка для
                    скачивания.
                  </li>
                </ul>
              </div>

              <div>
                <div className="font-semibold text-white/90">2.2. Данные, которые собираются технически</div>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>IP-адрес и технические данные запроса (например user-agent) в серверных логах.</li>
                  <li>
                    Cookie-файлы, необходимые для авторизации (мы используем cookie, чтобы «держать» вашу сессию после
                    входа).
                  </li>
                </ul>
              </div>

              <div>
                <div className="font-semibold text-white/90">2.3. Пароли</div>
                <div className="mt-2">
                  Мы не храним пароль в открытом виде. В базе хранится только криптографический хэш пароля.
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)]">
            <div className="text-sm font-semibold text-white">3. Зачем мы обрабатываем данные</div>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Регистрация, вход и поддержание сессии пользователя.</li>
              <li>Работа функций Платформы (публикации, избранное, чаты, аукционы, вложения).</li>
              <li>Техническая диагностика и безопасность сервиса.</li>
            </ul>
          </div>

          <div className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)]">
            <div className="text-sm font-semibold text-white">4. Кому мы передаём данные</div>
            <div className="mt-2">
              Мы не продаём персональные данные. Данные могут быть доступны провайдерам инфраструктуры (хостинг/серверы),
              которые обеспечивают работу Платформы, а также по законным запросам госорганов. Другим пользователям
              отображаются только те данные и материалы, которые вы сами сделали публичными на Платформе.
            </div>
          </div>

          <div className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)]">
            <div className="text-sm font-semibold text-white">5. Сроки хранения</div>
            <div className="mt-2">
              Мы храним данные столько, сколько нужно для работы Платформы и выполнения требований закона. Пользовательский
              контент и профиль могут храниться до удаления аккаунта/контента, если иное не требуется законом.
            </div>
          </div>

          <div className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)]">
            <div className="text-sm font-semibold text-white">6. Безопасность</div>
            <div className="mt-2">
              Мы применяем разумные технические и организационные меры защиты, включая HTTPS, ограничение доступа к серверу
              и базе данных, хранение паролей в виде хэшей и обновление ПО.
            </div>
          </div>

          <div className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)]">
            <div className="text-sm font-semibold text-white">7. Права пользователя</div>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Запросить информацию о своих данных и их обработке.</li>
              <li>Попросить исправить или удалить данные (в пределах технической возможности и закона).</li>
              <li>Отозвать согласие, если обработка основана на согласии.</li>
            </ul>
          </div>

          <div className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)]">
            <div className="text-sm font-semibold text-white">8. Изменения Политики</div>
            <div className="mt-2">
              Мы можем обновлять эту Политику. Новая версия действует с момента публикации на Платформе.
            </div>
          </div>

          <div className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)]">
            <div className="text-sm font-semibold text-white">9. Контакты</div>
            <div className="mt-2">
              По вопросам обработки персональных данных: <span className="text-white/90">support@startup-hub.ru</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

