"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AddListingPageChrome, addListingFieldClass } from "@/components/forms/addListingFormShell";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/I18nProvider";
import { formatLabelsByLang, stageLabelsByLang } from "@/lib/labelMaps";
import { formatDigitsWithSpaces, stripNonDigits } from "@/lib/numberFormat";
import { allowedCategories, asAllowedCategory } from "@/lib/categories";
import { uploadFiles, type UploadedAttachment } from "@/lib/uploads";

const stages = ["idea", "seed", "series_a", "series_b", "growth", "exit"] as const;
const formats = ["online", "offline", "hybrid"] as const;

export default function AddIdeaPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10 text-[rgba(234,240,255,0.72)]">Загрузка…</div>}>
      <AddIdeaInner />
    </Suspense>
  );
}

function AddIdeaInner() {
  const router = useRouter();
  const { lang } = useI18n();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("analysisId");

  const draftKey = "draft:add-idea";

  const [analysisInfo, setAnalysisInfo] = useState<null | { id: string; createdAt: string }>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(allowedCategories[0]?.value ?? "SaaS");
  const [price, setPrice] = useState<string>("");
  const [stage, setStage] = useState<(typeof stages)[number]>("idea");
  const [format, setFormat] = useState<(typeof formats)[number]>("online");

  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [market, setMarket] = useState("");

  const [city, setCity] = useState("");
  const [doneItemsRaw, setDoneItemsRaw] = useState("");
  const [needsText, setNeedsText] = useState("");
  const [helpTagsRaw, setHelpTagsRaw] = useState("");
  const [coverGradient, setCoverGradient] = useState<"default" | "emerald" | "violet" | "blue">("default");

  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!analysisId) return;
      try {
        const r = await fetch(`/api/v1/startup-analysis/${analysisId}`, { credentials: "include" });
        if (!r.ok) return;
        const data = (await r.json()) as any;
        if (!cancelled) setAnalysisInfo(data);
      } catch {
        // ignore
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const d = JSON.parse(raw) as any;
      if (!title && d?.title) setTitle(String(d.title));
      if (!description && d?.description) setDescription(String(d.description));
      if (category === (allowedCategories[0]?.value ?? "SaaS") && d?.category) setCategory(asAllowedCategory(String(d.category)));
      if (!price && d?.price) setPrice(String(d.price));
      if (d?.stage) setStage(d.stage);
      if (d?.format) setFormat(d.format);
      if (d?.problem) setProblem(String(d.problem));
      if (d?.solution) setSolution(String(d.solution));
      if (d?.market) setMarket(String(d.market));
      if (d?.city) setCity(String(d.city));
      if (d?.doneItemsRaw) setDoneItemsRaw(String(d.doneItemsRaw));
      if (d?.needsText) setNeedsText(String(d.needsText));
      if (d?.helpTagsRaw) setHelpTagsRaw(String(d.helpTagsRaw));
      if (d?.coverGradient) setCoverGradient(d.coverGradient);
      if (Array.isArray(d?.attachments)) setAttachments(d.attachments);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const priceNum = price === "" ? undefined : Number(price);
    if (priceNum !== undefined && !Number.isFinite(priceNum)) {
      setError("Цена должна быть числом");
      setLoading(false);
      return;
    }

    const doneItems = doneItemsRaw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 24);
    const helpTags = helpTagsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 24);

    // Friendly client-side validation mirroring server limits (see server/src/routes/v1/ideas.ts)
    if (title.trim().length > 120) {
      setError("Название слишком длинное (макс. 120 символов)");
      setLoading(false);
      return;
    }
    if (description.trim().length < 10) {
      setError("Описание слишком короткое (минимум 10 символов)");
      setLoading(false);
      return;
    }
    if (description.trim().length > 2000) {
      setError("Описание слишком длинное (макс. 2000 символов)");
      setLoading(false);
      return;
    }
    const tooLongDone = doneItems.find((x) => x.length > 120);
    if (tooLongDone) {
      setError("В блоке «Что уже сделано» каждый пункт должен быть короче 120 символов (сделай пункты по строкам).");
      setLoading(false);
      return;
    }
    if (needsText.trim().length > 2000) {
      setError("Поле «Что нужно для реализации» слишком длинное (макс. 2000 символов)");
      setLoading(false);
      return;
    }
    const tooLongTag = helpTags.find((x) => x.length > 40);
    if (tooLongTag) {
      setError("Теги помощи слишком длинные (каждый тег до 40 символов).");
      setLoading(false);
      return;
    }

    try {
      const r = await fetch("/api/v1/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          description,
          category,
          price: priceNum,
          stage,
          format,
          analysisId: analysisId || undefined,
          attachmentIds: attachments.map((a) => a.id),
          problem: problem || undefined,
          solution: solution || undefined,
          market: market || undefined,
          profileExtra: {
            city: city.trim() || undefined,
            doneItems: doneItems.length ? doneItems : undefined,
            needsText: needsText.trim() || undefined,
            helpTags: helpTags.length ? helpTags : undefined,
            coverGradient: coverGradient === "default" ? undefined : coverGradient,
          },
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        const base = (data?.error as string) ?? "Ошибка при создании";
        const details = (data as any)?.details;
        const fieldErrors: Record<string, string[] | undefined> | undefined = details?.fieldErrors;
        const firstField = fieldErrors ? Object.keys(fieldErrors).find((k) => (fieldErrors[k]?.length ?? 0) > 0) : undefined;
        const firstMsg = firstField ? fieldErrors?.[firstField]?.[0] : undefined;
        setError(firstMsg ? `${base}: ${firstMsg}` : base);
        return;
      }
      try {
        localStorage.removeItem(draftKey);
      } catch {
        // ignore
      }
      router.push(`/ideas/${data.id}`);
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setLoading(false);
    }
  }

  const fc = addListingFieldClass;

  return (
    <AddListingPageChrome
      backHref="/marketplace?tab=ideas"
      title="Разместить идею"
      subtitle="Оформление как у карточки стартапа — те же поля и визуальная иерархия"
    >
      <form onSubmit={onSubmit} className="space-y-16 rounded-3xl border border-white/10 bg-[#12121A] p-8 md:p-10">
        {analysisId ? (
          <div className="rounded-3xl border border-violet-500/30 bg-violet-500/10 p-5">
            <div className="text-sm font-semibold text-white">Прикреплён анализатор</div>
            <div className="mt-1 text-xs text-gray-400">
              ID: <span className="text-white/90">{analysisId}</span>
              {analysisInfo?.createdAt ? <> · {new Date(analysisInfo.createdAt).toLocaleString("ru-RU")}</> : null}
            </div>
          </div>
        ) : null}

        <div>
          <h2 className="mb-8 flex items-center gap-3 text-2xl font-semibold text-white">
            <span className="text-violet-400">1</span> Основная информация
          </h2>
          <div className="space-y-8">
            <div>
              <label className="mb-2 block text-sm text-gray-400">Название</label>
              <input className={fc} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: приложение для учёта лекарств" />
              <p className="mt-2 text-sm text-gray-500">Коротко: что за идея и для кого.</p>
            </div>
            <div>
              <label className="mb-2 block text-sm text-gray-400">Описание</label>
              <textarea
                className={`${fc} min-h-[140px] rounded-3xl`}
                placeholder="Суть, проблема, аудитория, что ищешь на платформе…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <label>
                <div className="mb-2 block text-sm text-gray-400">Категория</div>
                <select className={fc} value={category} onChange={(e) => setCategory(asAllowedCategory(e.target.value))}>
                  {allowedCategories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <div className="mb-2 block text-sm text-gray-400">Цена (ориентир, ₽)</div>
                <input
                  className={fc}
                  value={formatDigitsWithSpaces(price)}
                  onChange={(e) => setPrice(stripNonDigits(e.target.value))}
                  inputMode="numeric"
                  placeholder="0"
                />
              </label>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <label>
                <div className="mb-2 block text-sm text-gray-400">Стадия</div>
                <select className={fc} value={stage} onChange={(e) => setStage(e.target.value as (typeof stages)[number])}>
                  {stages.map((s) => (
                    <option key={s} value={s}>
                      {stageLabelsByLang[lang]?.[s] ?? s}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <div className="mb-2 block text-sm text-gray-400">Формат</div>
                <select className={fc} value={format} onChange={(e) => setFormat(e.target.value as (typeof formats)[number])}>
                  {formats.map((f) => (
                    <option key={f} value={f}>
                      {formatLabelsByLang[lang]?.[f] ?? f}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0A0A0F] p-6">
              <div className="text-sm font-semibold text-white">Поля карточки (как в превью)</div>
              <p className="mt-2 text-sm text-gray-500">Город, «что сделано», «что нужно», теги помощи и градиент шапки.</p>
              <div className="mt-6 space-y-6">
                <label>
                  <div className="mb-2 block text-sm text-gray-400">Город</div>
                  <input className={fc} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Москва" />
                </label>
                <label>
                  <div className="mb-2 block text-sm text-gray-400">Что уже сделано (каждая строка — пункт)</div>
                  <textarea className={`${fc} min-h-[120px] rounded-3xl`} value={doneItemsRaw} onChange={(e) => setDoneItemsRaw(e.target.value)} rows={5} />
                </label>
                <label>
                  <div className="mb-2 block text-sm text-gray-400">Что нужно для реализации</div>
                  <textarea className={`${fc} min-h-[100px] rounded-3xl`} value={needsText} onChange={(e) => setNeedsText(e.target.value)} rows={4} />
                </label>
                <label>
                  <div className="mb-2 block text-sm text-gray-400">Нужна помощь (теги через запятую)</div>
                  <input className={fc} value={helpTagsRaw} onChange={(e) => setHelpTagsRaw(e.target.value)} placeholder="Сооснователь, Инвестиции, Менторство" />
                </label>
                <label>
                  <div className="mb-2 block text-sm text-gray-400">Градиент шапки</div>
                  <select className={fc} value={coverGradient} onChange={(e) => setCoverGradient(e.target.value as any)}>
                    <option value="default">Тёплый (янтарь → оранж)</option>
                    <option value="emerald">Изумруд → бирюза</option>
                    <option value="violet">Фиолет → роза</option>
                    <option value="blue">Синий → циан</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-8 flex items-center gap-3 text-2xl font-semibold text-white">
            <span className="text-rose-400">2</span> Детали и анализатор
          </h2>
          <div className="space-y-8">
            <Button
              type="button"
              variant="secondary"
              className="w-full rounded-2xl py-4 text-base"
              onClick={() => {
                try {
                  localStorage.setItem(
                    draftKey,
                    JSON.stringify({
                      title,
                      description,
                      category,
                      price,
                      stage,
                      format,
                      problem,
                      solution,
                      market,
                      city,
                      doneItemsRaw,
                      needsText,
                      helpTagsRaw,
                      coverGradient,
                      attachments,
                    }),
                  );
                } catch {
                  // ignore
                }
                router.push(`/startup-analyzer?mode=idea&returnTo=/add-idea`);
              }}
            >
              Создать отчёт анализатора
            </Button>
            <div>
              <label className="mb-2 block text-sm text-gray-400">Проблема (опционально)</label>
              <textarea className={`${fc} min-h-[100px] rounded-3xl`} placeholder="Боль пользователя…" value={problem} onChange={(e) => setProblem(e.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm text-gray-400">Решение (опционально)</label>
              <textarea className={`${fc} min-h-[100px] rounded-3xl`} placeholder="Как решаешь проблему…" value={solution} onChange={(e) => setSolution(e.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm text-gray-400">Рынок (опционально)</label>
              <textarea className={`${fc} min-h-[100px] rounded-3xl`} placeholder="Аудитория, размер рынка…" value={market} onChange={(e) => setMarket(e.target.value)} />
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-8 flex items-center gap-3 text-2xl font-semibold text-white">
            <span className="text-emerald-400">3</span> Файлы
          </h2>
          <div className="rounded-3xl border border-white/10 bg-[#0A0A0F] p-6">
            <p className="text-sm text-gray-400">Презентация, PDF, таблицы — по желанию.</p>
            <input
              type="file"
              multiple
              className="mt-4 text-sm text-gray-400"
              onChange={async (e) => {
                if (!e.target.files || e.target.files.length === 0) return;
                setUploading(true);
                setError(null);
                try {
                  const uploaded = await uploadFiles(e.target.files);
                  setAttachments((prev) => [...uploaded, ...prev]);
                  e.target.value = "";
                } catch (err: unknown) {
                  setError(err instanceof Error ? err.message : "Не удалось загрузить файлы");
                } finally {
                  setUploading(false);
                }
              }}
            />
            {uploading ? <div className="mt-2 text-xs text-gray-500">Загрузка…</div> : null}
            {attachments.length ? (
              <div className="mt-4 space-y-2">
                {attachments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#12121A] px-3 py-2 text-sm text-white/90"
                  >
                    <a href={a.url} target="_blank" rel="noreferrer" className="truncate">
                      {a.filename}
                    </a>
                    <Button type="button" variant="ghost" className="h-8 shrink-0 px-2 text-xs" onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}>
                      Убрать
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {error ? <div className="text-sm text-red-300">{error}</div> : null}

        <div className="border-t border-white/10 pt-10">
          <Button
            type="submit"
            disabled={loading || uploading}
            className="w-full rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 py-7 text-xl font-semibold text-white hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "…" : "Опубликовать идею"}
          </Button>
        </div>
      </form>
    </AddListingPageChrome>
  );
}


