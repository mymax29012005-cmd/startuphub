"use client";

import React, { use as useReact, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/I18nProvider";
import { allowedCategories } from "@/lib/categories";
import { formatLabelsByLang, stageLabelsByLang } from "@/lib/labelMaps";
import { formatDigitsWithSpaces, stripNonDigits } from "@/lib/numberFormat";
import { uploadFiles, type UploadedAttachment } from "@/lib/uploads";

const stages = ["idea", "seed", "series_a", "series_b", "growth", "exit"] as const;
const formats = ["online", "offline", "hybrid"] as const;

type Me = { id: string; role: "user" | "admin" };

type StartupDetail = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  stage: string;
  format: string;
  isOnline: boolean;
  analysisId?: string | null;
  attachments?: UploadedAttachment[];
  owner: { id: string };
};

export default function EditStartupPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useI18n();
  const { id } = useReact(params);

  const analysisIdFromUrl = searchParams.get("analysisId");

  const [me, setMe] = useState<Me | null>(null);
  const [item, setItem] = useState<StartupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(allowedCategories[0]?.value ?? "SaaS");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState<(typeof stages)[number]>("seed");
  const [format, setFormat] = useState<(typeof formats)[number]>("hybrid");
  const [isOnline, setIsOnline] = useState(true);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analysisInfo, setAnalysisInfo] = useState<null | {
    id: string;
    createdAt: string;
    result?: { riskAvg?: number; valuationLow?: number; valuationHigh?: number; successProbability?: number };
  }>(null);

  const draftKey = `draft:edit-startup:${id}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (r.ok && !cancelled) setMe((await r.json()) as Me);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setErr(null);
      try {
        const r = await fetch(`/api/v1/startups/${id}`, { cache: "no-store", credentials: "include" });
        if (!r.ok) {
          const j = await r.json().catch(() => null);
          setErr(j?.error ?? "Не удалось загрузить");
          return;
        }
        const data = (await r.json()) as StartupDetail;
        if (cancelled) return;
        setItem(data);
        setTitle(data.title ?? "");
        setCategory(data.category ?? (allowedCategories[0]?.value ?? "SaaS"));
        setPrice(String(data.price ?? ""));
        setDescription(data.description ?? "");
        setStage((data.stage as any) ?? "seed");
        setFormat((data.format as any) ?? "hybrid");
        setIsOnline(!!data.isOnline);
        setAnalysisId((data.analysisId as any) ?? null);
        setAttachments((data.attachments as any) ?? []);
      } catch {
        if (!cancelled) setErr("Сетевая ошибка");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    // Restore draft after returning from analyzer.
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const d = JSON.parse(raw) as any;
      if (d?.title != null) setTitle(String(d.title));
      if (d?.description != null) setDescription(String(d.description));
      if (d?.category != null) setCategory(String(d.category));
      if (d?.price != null) setPrice(String(d.price));
      if (d?.stage) setStage(d.stage);
      if (d?.format) setFormat(d.format);
      if (typeof d?.isOnline === "boolean") setIsOnline(d.isOnline);
      if (Array.isArray(d?.attachments)) setAttachments(d.attachments);
      localStorage.removeItem(draftKey);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (analysisIdFromUrl) setAnalysisId(analysisIdFromUrl);
  }, [analysisIdFromUrl]);

  useEffect(() => {
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
    router.push(`/startup-analyzer?mode=startup&returnTo=/startups/${id}/edit`);
  }

  const canEdit = me && item && (me.role === "admin" || me.id === item.owner.id);

  const fieldClass =
    "focus-ring w-full rounded-2xl border border-white/10 bg-[#1A1A24] px-7 py-5 text-base text-white outline-none placeholder:text-gray-500 focus:border-violet-500 [color-scheme:dark]";

  return (
    <div className="mx-auto max-w-5xl px-6 pb-20 pt-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link href={`/startups/${id}`} className="text-sm text-gray-400 transition hover:text-white">
          ← К проекту
        </Link>
      </div>

      <h1 className="text-center text-4xl font-bold tracking-tighter text-white md:text-5xl">Редактировать проект</h1>
      <p className="mb-10 mt-2 text-center text-lg text-gray-400">Изменения вступят в силу после сохранения</p>

      {loading ? (
        <div className="text-center text-[rgba(234,240,255,0.72)]">Загрузка…</div>
      ) : err && !item ? (
        <div className="text-center text-sm text-red-300">{err}</div>
      ) : !item ? (
        <div className="text-center text-[rgba(234,240,255,0.72)]">Не найдено.</div>
      ) : !canEdit ? (
        <div className="text-center text-[rgba(234,240,255,0.72)]">Нет прав на редактирование.</div>
      ) : (
        <form
          className="space-y-16 rounded-3xl border border-white/10 bg-[#12121A] p-8 md:p-10"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            setErr(null);
            try {
              const priceNum = price === "" ? undefined : Number(price);
              const r = await fetch(`/api/v1/startups/${id}`, {
                method: "PUT",
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
                  analysisId,
                  attachmentIds: attachments.map((a) => a.id),
                }),
              });
              const j = await r.json().catch(() => null);
              if (!r.ok) {
                setErr(j?.error ?? "Не удалось сохранить");
                return;
              }
              router.push(`/startups/${id}`);
            } catch {
              setErr("Сетевая ошибка");
            } finally {
              setSaving(false);
            }
          }}
        >
          <div>
            <h2 className="mb-8 flex items-center gap-3 text-2xl font-semibold text-white">
              <span className="text-violet-400">1</span> Основная информация
            </h2>
            <div className="space-y-8">
              <div>
                <label className="mb-2 block text-sm text-gray-400">Название проекта</label>
                <input
                  className={fieldClass}
                  placeholder="Например: SalesAI Pro"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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

          <div>
            <h2 className="mb-6 flex items-center gap-3 text-2xl font-semibold text-white">
              <span className="text-amber-400">2</span> Материалы проекта{" "}
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
                    setErr(null);
                    try {
                      const uploaded = await uploadFiles(e.target.files);
                      setAttachments((prev) => [...uploaded, ...prev]);
                      e.target.value = "";
                    } catch (uploadErr: any) {
                      setErr(uploadErr?.message ?? "Не удалось загрузить файлы");
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
                          router.replace(`/startups/${id}/edit`);
                          setAnalysisId(null);
                          setAnalysisInfo(null);
                        }}
                      >
                        Убрать отчёт
                      </Button>
                    </div>
                    <div className="mt-2 text-[10px] text-gray-500">Сохраните форму, чтобы зафиксировать отчёт в карточке.</div>
                  </div>
                ) : (
                  <>
                    <div className="text-4xl">📊</div>
                    <p className="mt-4 font-medium text-white">Отчёт анализатора</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Черновик сохранится локально — после анализа вы вернётесь сюда с готовым отчётом
                    </p>
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

          {err ? <div className="text-sm text-red-300">{err}</div> : null}

          <div className="border-t border-white/10 pt-10">
            <Button
              type="submit"
              disabled={saving}
              className="w-full rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 py-7 text-xl font-semibold text-white hover:brightness-110 disabled:opacity-60"
            >
              {saving ? "…" : "Сохранить изменения"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

