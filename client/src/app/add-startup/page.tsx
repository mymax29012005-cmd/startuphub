"use client";

import Link from "next/link";
import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useI18n } from "@/i18n/I18nProvider";
import { formatLabelsByLang, stageLabelsByLang } from "@/lib/labelMaps";
import { formatDigitsWithSpaces, stripNonDigits } from "@/lib/numberFormat";
import { allowedCategories } from "@/lib/categories";
import { uploadFiles, type UploadedAttachment } from "@/lib/uploads";

const stages = ["idea", "seed", "series_a", "series_b", "growth", "exit"] as const;
const formats = ["online", "offline", "hybrid"] as const;

export default function AddStartupPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10 text-[rgba(234,240,255,0.72)]">Загрузка…</div>}>
      <AddStartupInner />
    </Suspense>
  );
}

function AddStartupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useI18n();

  const analysisId = searchParams.get("analysisId");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(allowedCategories[0]?.value ?? "SaaS");
  const [price, setPrice] = useState<string>("");

  const [stage, setStage] = useState<(typeof stages)[number]>("seed");
  const [format, setFormat] = useState<(typeof formats)[number]>("hybrid");
  const [isOnline, setIsOnline] = useState(true);

  const [withAuction, setWithAuction] = useState(false);
  const [auctionCurrentPrice, setAuctionCurrentPrice] = useState<string>("");
  const [auctionEndsAt, setAuctionEndsAt] = useState("");

  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [analysisInfo, setAnalysisInfo] = useState<null | {
    id: string;
    createdAt: string;
    result?: { riskAvg?: number; valuationLow?: number; valuationHigh?: number; successProbability?: number };
  }>(null);

  const draftKey = "draft:add-startup";

  React.useEffect(() => {
    // Restore draft after returning from analyzer.
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const d = JSON.parse(raw) as any;
      if (!title && d?.title) setTitle(String(d.title));
      if (!description && d?.description) setDescription(String(d.description));
      if (category === (allowedCategories[0]?.value ?? "SaaS") && d?.category) setCategory(String(d.category));
      if (!price && d?.price) setPrice(String(d.price));
      if (d?.stage) setStage(d.stage);
      if (d?.format) setFormat(d.format);
      if (typeof d?.isOnline === "boolean") setIsOnline(d.isOnline);
      if (Array.isArray(d?.attachments)) setAttachments(d.attachments);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!analysisId) {
        setAnalysisInfo(null);
        return;
      }
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

  function saveDraftForAnalyzer() {
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
          isOnline,
          attachments,
        }),
      );
    } catch {
      // ignore
    }
    router.push(`/startup-analyzer?mode=startup&returnTo=/add-startup`);
  }

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

    const auctionPriceNum =
      withAuction && auctionCurrentPrice !== "" ? Number(auctionCurrentPrice) : undefined;
    if (auctionPriceNum !== undefined && !Number.isFinite(auctionPriceNum)) {
      setError("Текущая цена аукциона должна быть числом");
      setLoading(false);
      return;
    }

    try {
      const r = await fetch("/api/v1/startups", {
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
          isOnline,
          analysisId: analysisId || undefined,
          attachmentIds: attachments.map((a) => a.id),
          auction: withAuction
            ? {
                currentPrice: auctionPriceNum,
                endsAt: auctionEndsAt ? new Date(auctionEndsAt) : undefined,
              }
            : undefined,
        }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError((data?.error as string) ?? "Ошибка при создании");
        return;
      }
      try {
        localStorage.removeItem(draftKey);
      } catch {
        // ignore
      }
      router.push(`/startups/${data.id}`);
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "focus-ring w-full rounded-2xl border border-white/10 bg-[#1A1A24] px-7 py-5 text-base text-white outline-none placeholder:text-gray-500 focus:border-violet-500 [color-scheme:dark]";

  return (
    <div className="mx-auto max-w-5xl px-6 pb-20 pt-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link href="/marketplace?tab=startups" className="text-sm text-gray-400 transition hover:text-white">
          ← В маркетплейс
        </Link>
      </div>

      <h1 className="text-center text-4xl font-bold tracking-tighter text-white md:text-5xl">Создать проект</h1>
      <p className="mb-10 mt-2 text-center text-lg text-gray-400">Все поля после основного блока — по желанию</p>

      <form onSubmit={onSubmit} className="space-y-16 rounded-3xl border border-white/10 bg-[#12121A] p-8 md:p-10">
        {/* 1 */}
        <div>
          <h2 className="mb-8 flex items-center gap-3 text-2xl font-semibold text-white">
            <span className="text-violet-400">1</span> Основная информация
          </h2>
          <div className="space-y-8">
            <div>
              <label className="mb-2 block text-sm text-gray-400">Название проекта</label>
              <input
                className={fieldClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: SalesAI Pro"
              />
            </div>
            <label>
              <div className="mb-2 block text-sm text-gray-400">Отрасль</div>
              <select className={fieldClass} value={category} onChange={(e) => setCategory(e.target.value)}>
                {allowedCategories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <label className="mb-2 block text-sm text-gray-400">Сумма привлечения (₽)</label>
              <div className="flex">
                <input
                  className={`${fieldClass} rounded-r-none border-r-0`}
                  value={formatDigitsWithSpaces(price)}
                  onChange={(e) => setPrice(stripNonDigits(e.target.value))}
                  inputMode="numeric"
                  placeholder="12 000 000"
                />
                <span className="flex items-center rounded-r-2xl border border-l-0 border-white/10 bg-[#1A1A24] px-5 text-gray-400">
                  ₽
                </span>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm text-gray-400">Полное описание</label>
              <textarea
                className={`${fieldClass} min-h-[140px] rounded-3xl`}
                placeholder="Что делаете, для кого, чем сильнее конкурентов, текущий статус…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <label>
                <div className="mb-2 block text-sm text-gray-400">Стадия</div>
                <select className={fieldClass} value={stage} onChange={(e) => setStage(e.target.value as any)}>
                  {stages.map((s) => (
                    <option key={s} value={s}>
                      {stageLabelsByLang[lang]?.[s] ?? s}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <div className="mb-2 block text-sm text-gray-400">Формат</div>
                <select className={fieldClass} value={format} onChange={(e) => setFormat(e.target.value as any)}>
                  {formats.map((f) => (
                    <option key={f} value={f}>
                      {formatLabelsByLang[lang]?.[f] ?? f}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" checked={isOnline} onChange={(e) => setIsOnline(e.target.checked)} className="accent-violet-500" />
              <span className="text-sm text-gray-300">Онлайн-проект</span>
            </label>
          </div>
        </div>

        {/* 2 */}
        <div>
          <h2 className="mb-8 flex items-center gap-3 text-2xl font-semibold text-white">
            <span className="text-rose-400">2</span> Аукцион <span className="text-xs font-normal text-gray-500">(опционально)</span>
          </h2>
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={withAuction} onChange={(e) => setWithAuction(e.target.checked)} className="accent-rose-500" />
            <span className="text-sm text-gray-300">Создать активный аукцион сразу</span>
          </label>
          {withAuction ? (
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-gray-400">Текущая цена (₽)</label>
                <Input
                  placeholder="Стартовая ставка"
                  value={formatDigitsWithSpaces(auctionCurrentPrice)}
                  onChange={(e) => setAuctionCurrentPrice(stripNonDigits(e.target.value))}
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">Окончание</label>
                <Input type="datetime-local" value={auctionEndsAt} onChange={(e) => setAuctionEndsAt(e.target.value)} />
              </div>
            </div>
          ) : null}
        </div>

        {/* 3 — материалы + анализатор */}
        <div>
          <h2 className="mb-6 flex items-center gap-3 text-2xl font-semibold text-white">
            <span className="text-amber-400">3</span> Материалы проекта{" "}
            <span className="text-xs font-normal text-gray-500">(опционально)</span>
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <label className="upload-box cursor-pointer rounded-3xl border-2 border-dashed border-white/30 p-10 text-center">
              <input
                type="file"
                multiple
                className="sr-only"
                onChange={async (e) => {
                  if (!e.target.files || e.target.files.length === 0) return;
                  setUploading(true);
                  setError(null);
                  try {
                    const uploaded = await uploadFiles(e.target.files);
                    setAttachments((prev) => [...uploaded, ...prev]);
                    e.target.value = "";
                  } catch (err: any) {
                    setError(err?.message ?? "Не удалось загрузить файлы");
                  } finally {
                    setUploading(false);
                  }
                }}
              />
              <div className="text-4xl">📎</div>
              <p className="mt-4 font-medium text-white">Файлы</p>
              <p className="mt-1 text-xs text-gray-500">PDF, таблицы, архивы — нажмите или перетащите</p>
            </label>

            <div
              className={`upload-box rounded-3xl border-2 border-dashed p-8 text-center ${
                analysisId ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/30"
              }`}
            >
              {analysisId ? (
                <div className="text-left">
                  <div className="text-sm font-semibold text-emerald-400">Отчёт анализатора прикреплён</div>
                  <div className="mt-2 text-xs text-gray-400">
                    {analysisInfo?.createdAt
                      ? new Date(analysisInfo.createdAt).toLocaleString("ru-RU")
                      : "Загрузка метаданных…"}
                  </div>
                  {analysisInfo?.result?.successProbability != null ? (
                    <div className="mt-3 text-sm text-white">
                      Вероятность успеха:{" "}
                      <span className="font-semibold text-emerald-300">
                        {Math.round(Number(analysisInfo.result.successProbability) * 100)}%
                      </span>
                    </div>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" className="h-10 text-xs" onClick={saveDraftForAnalyzer}>
                      Заменить отчёт
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-10 text-xs"
                      onClick={() => {
                        router.replace("/add-startup");
                        setAnalysisInfo(null);
                      }}
                    >
                      Убрать отчёт
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-4xl">📊</div>
                  <p className="mt-4 font-medium text-white">Отчёт анализатора</p>
                  <p className="mt-1 text-xs text-gray-500">Сохраните черновик и перейдите в анализатор — отчёт подставится в карточку</p>
                  <Button type="button" className="mt-6 w-full rounded-2xl py-4 font-medium" variant="secondary" onClick={saveDraftForAnalyzer}>
                    Создать и прикрепить отчёт
                  </Button>
                </>
              )}
            </div>
          </div>

          {uploading ? <div className="mt-4 text-sm text-gray-400">Загрузка файлов…</div> : null}
          {attachments.length ? (
            <div className="mt-6 space-y-2">
              {attachments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#1A1A24] px-4 py-3"
                >
                  <a href={a.url} target="_blank" rel="noreferrer" className="truncate text-sm text-white/90">
                    {a.filename}
                  </a>
                  <Button type="button" variant="ghost" className="h-8 shrink-0 px-3 text-xs" onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}>
                    Убрать
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {error ? <div className="text-sm text-red-300">{error}</div> : null}

        <div className="border-t border-white/10 pt-10">
          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 py-7 text-xl font-semibold text-white hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "…" : "Опубликовать проект"}
          </Button>
        </div>
      </form>
    </div>
  );
}


