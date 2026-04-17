"use client";

import React from "react";
import Link from "next/link";

import { Card } from "@/components/ui/Card";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link href="/" className="text-[var(--accent)] hover:text-white text-sm font-medium">
          ← На главную
        </Link>
      </div>

      <Card className="p-6 md:p-10">
        <h1 className="text-2xl font-semibold text-white">Правила платформы (Пользовательское соглашение)</h1>
        <div className="mt-2 text-xs text-[rgba(234,240,255,0.65)]">
          Дата вступления в силу: 15 апреля 2026 г. · Последнее обновление: 15 апреля 2026 г.
        </div>

        <div className="mt-6 space-y-5 text-sm text-[rgba(234,240,255,0.78)] leading-relaxed">
          <p>
            Эти Правила регулируют использование платформы StartupHub (далее — «Платформа»). Используя Платформу, вы
            соглашаетесь с Правилами.
          </p>

          <div className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)]">
            <div className="text-sm font-semibold text-white">1. Для кого Платформа</div>
            <div className="mt-2">
              Платформа предназначена для пользователей **от 16 лет**. Если вам меньше 16 лет — пожалуйста, не
              используйте Платформу.
            </div>
          </div>

          <div className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)]">
            <div className="text-sm font-semibold text-white">2. Что умеет Платформа</div>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Профиль пользователя.</li>
              <li>Публикация карточек стартапов, идей, запросов инвесторов и партнёров.</li>
              <li>Аукционы и ставки (по механике, реализованной на Платформе).</li>
              <li>Чаты между пользователями.</li>
              <li>Вложения (файлы) и отчёты анализатора — если пользователь их добавляет.</li>
            </ul>
            <div className="mt-3">
              Платформа — информационный сервис. Любые договорённости и сделки между пользователями осуществляются
              **вне Платформы**, если Оператор явно не укажет иное.
            </div>
          </div>

          <div className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)]">
            <div className="text-sm font-semibold text-white">3. Регистрация и аккаунт</div>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Пользователь обязуется указывать корректные данные (email/телефон) для входа.</li>
              <li>Пользователь отвечает за сохранность своих данных доступа.</li>
              <li>Запрещено получать доступ к чужим аккаунтам, обходить ограничения и вмешиваться в работу сервиса.</li>
            </ul>
          </div>

          <div className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)]">
            <div className="text-sm font-semibold text-white">4. Контент пользователя</div>
            <div className="mt-2">
              Вы отвечаете за контент, который публикуете (тексты, файлы, описания, заявления о проекте). Запрещено
              размещать незаконный контент, спам, вредоносные материалы, а также материалы, нарушающие права третьих лиц.
              Оператор вправе ограничить доступ к контенту или аккаунту при нарушении Правил.
            </div>
          </div>

          <div className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)]">
            <div className="text-sm font-semibold text-white">5. Рейтинг и отзывы</div>
            <div className="mt-2">
              На Платформе может отображаться рейтинг пользователя. Рейтинг считается как среднее значение оценок (1–5)
              по отзывам, оставленным другими пользователями. Если отзывов нет — рейтинг может отображаться как 0.0.
            </div>
          </div>

          <div className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)]">
            <div className="text-sm font-semibold text-white">6. Ответственность</div>
            <div className="mt-2">
              Платформа предоставляется «как есть». Оператор стремится обеспечивать стабильность, но не гарантирует
              бесперебойную работу и отсутствие ошибок. Оператор не отвечает за действия пользователей и последствия их
              договорённостей.
            </div>
          </div>

          <div className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)]">
            <div className="text-sm font-semibold text-white">7. Изменения Правил</div>
            <div className="mt-2">
              Оператор может изменять Правила. Новая версия действует с момента публикации на Платформе.
            </div>
          </div>

          <div className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)]">
            <div className="text-sm font-semibold text-white">8. Контакты</div>
            <div className="mt-2">
              По вопросам работы Платформы: <span className="text-white/90">genstartup@yandex.ru</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

