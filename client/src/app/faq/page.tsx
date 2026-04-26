"use client";

import React from "react";
import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { INDUSTRY_CATEGORIES_BY_SECTOR, INDUSTRY_SECTORS } from "@/lib/industryHierarchy";

const quickFaq = [
  {
    q: "Как разместить стартап?",
    a: "Открой “Стартапы” → “+ Добавить стартап”, заполни поля и нажми “Опубликовать”.",
  },
  {
    q: "Как разместить идею?",
    a: "Открой “Идеи” → “+ Добавить идею”, опиши суть и нажми “Опубликовать”.",
  },
  {
    q: "Как работает рейтинг?",
    a: "Рейтинг — это средняя оценка (1–5) по отзывам о пользователе. Если отзывов нет — может быть 0.0.",
  },
  {
    q: "Можно ли редактировать/удалять карточки?",
    a: "Да. В карточке есть “Редактировать”, а “Удалить” доступно владельцу и админу.",
  },
  {
    q: "Что делать, если не получается войти?",
    a: "Проверь, чем регистрировался (email или телефон) и вводи только один из них при входе.",
  },
];

const howToSteps = [
  {
    title: "1) Создай аккаунт",
    text: "Регистрация — по email или телефону. Дальше можно заполнить профиль (имя/описание).",
  },
  {
    title: "2) Выбери сценарий",
    text: "Продать/показать проект → “Стартапы/Идеи”. Найти деньги/партнёра → “Инвесторы/Партнёры”.",
  },
  {
    title: "3) Опубликуй карточку",
    text: "Название, отрасль и категория из списков, описание и цена. Можно приложить файлы и отчёт анализатора.",
  },
  {
    title: "4) Общайся в чатах",
    text: "Открой профиль пользователя → “Перейти в чат”. Непрочитанные отмечаются точками.",
  },
  {
    title: "5) Маркетплейс и фильтры",
    text: "На маркетплейсе можно отфильтровать карточки по отрасли и другим параметрам, чтобы быстрее находить релевантные проекты.",
  },
];

const analyzerSteps = [
  {
    title: "Шаг 1 — сохрани черновик",
    text: "В форме стартапа/идеи нажми кнопку анализатора — черновик сохранится, чтобы не потерять заполненное.",
  },
  {
    title: "Шаг 2 — заполни данные",
    text: "В анализаторе заполни блоки: продукт, рынок, команда, финансы и риски. Подсказки внутри помогают понять, что писать.",
  },
  {
    title: "Шаг 3 — получи отчёт",
    text: "Анализатор формирует результаты и визуализации. Можно вернуться назад без прикрепления или прикрепить отчёт к карточке.",
  },
  {
    title: "Шаг 4 — прикрепи/замени/убери",
    text: "В карточке отчёт можно заменить новым или убрать. Изменения сохраняются после “Сохранить/Опубликовать”.",
  },
];

function Arrow() {
  return (
    <div className="flex items-center justify-center py-2 text-[rgba(234,240,255,0.45)] select-none">
      ↓
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link href="/" className="text-[var(--accent)] hover:text-white text-sm font-medium">
          ← На главную
        </Link>
      </div>

      <Card className="p-6 md:p-10">
        <h1 className="text-2xl font-semibold text-white">FAQ — часто задаваемые вопросы</h1>
        <div className="mt-3 text-xs text-[rgba(234,240,255,0.55)]">
          Отрасли на платформе:{" "}
          <span className="text-[rgba(234,240,255,0.85)]">
            {INDUSTRY_SECTORS.map((s) => s.label).join(" · ")}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4">
          {quickFaq.map((x) => (
            <div key={x.q} className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)]">
              <div className="text-sm font-semibold text-white">{x.q}</div>
              <div className="mt-2 text-sm text-[rgba(234,240,255,0.72)] leading-relaxed">{x.a}</div>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <div className="text-lg font-semibold text-white">Инструкция по пользованию (подробно)</div>
          <div className="mt-2 text-xs text-[rgba(234,240,255,0.55)]">
            Ниже — последовательность шагов и разбор основных разделов. Это один раз прочитать — и дальше всё становится
            очевидно.
          </div>

          <div className="mt-6">
            {howToSteps.map((s, idx) => (
              <React.Fragment key={s.title}>
                <div className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)]">
                  <div className="text-sm font-semibold text-white">{s.title}</div>
                  <div className="mt-2 text-sm text-[rgba(234,240,255,0.72)] leading-relaxed">{s.text}</div>
                </div>
                {idx === howToSteps.length - 1 ? null : <Arrow />}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)]">
              <div className="text-sm font-semibold text-white">Отрасль и категория — как выбрать</div>
              <div className="mt-2 text-sm text-[rgba(234,240,255,0.72)] leading-relaxed">
                Сначала выбери отрасль (крупная группа), затем категорию внутри неё — так карточка попадает в нужные
                фильтры на маркетплейсе. Лучше “примерно верно”, чем долго искать идеальное название.
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {INDUSTRY_SECTORS.map((s) => (
                  <div key={s.id} className="rounded-2xl bg-white/[0.04] border border-[rgba(255,255,255,0.10)] p-3">
                    <div className="text-xs font-semibold text-white">{s.label}</div>
                    <ul className="mt-2 list-disc pl-4 text-xs text-[rgba(234,240,255,0.70)] space-y-0.5">
                      {INDUSTRY_CATEGORIES_BY_SECTOR[s.id].map((c) => (
                        <li key={c.id}>{c.label}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-3xl p-5 border border-[rgba(255,255,255,0.12)]">
              <div className="text-sm font-semibold text-white">Анализатор — подробная инструкция</div>
              <div className="mt-2 text-sm text-[rgba(234,240,255,0.72)] leading-relaxed">
                Анализатор нужен, чтобы структурировать описание проекта и показать сильные/слабые места без “воды”.
              </div>
              <div className="mt-4">
                {analyzerSteps.map((s, idx) => (
                  <React.Fragment key={s.title}>
                    <div className="rounded-2xl bg-white/[0.04] border border-[rgba(255,255,255,0.10)] p-3">
                      <div className="text-xs font-semibold text-white">{s.title}</div>
                      <div className="mt-1 text-xs text-[rgba(234,240,255,0.70)] leading-relaxed">{s.text}</div>
                    </div>
                    {idx === analyzerSteps.length - 1 ? null : (
                      <div className="flex items-center justify-center py-2 text-[rgba(234,240,255,0.40)]">↓</div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

