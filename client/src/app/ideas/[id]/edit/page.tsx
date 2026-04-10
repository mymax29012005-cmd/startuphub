"use client";

import React, { use as useReact, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useI18n } from "@/i18n/I18nProvider";
import { allowedCategories } from "@/lib/categories";
import { formatLabelsByLang, stageLabelsByLang } from "@/lib/labelMaps";
import { formatDigitsWithSpaces, stripNonDigits } from "@/lib/numberFormat";
import { uploadFiles, type UploadedAttachment } from "@/lib/uploads";

const stages = ["idea", "seed", "series_a", "series_b", "growth", "exit"] as const;
const formats = ["online", "offline", "hybrid"] as const;

type Me = { id: string; role: "user" | "admin" };

type IdeaDetail = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  stage: string;
  format: string;
  owner: { id: string };
  problem: string | null;
  solution: string | null;
  market: string | null;
  analysisId?: string | null;
  attachments?: UploadedAttachment[];
};

export default function EditIdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useI18n();
  const { id } = useReact(params);

  const analysisIdFromUrl = searchParams.get("analysisId");

  const [me, setMe] = useState<Me | null>(null);
  const [item, setItem] = useState<IdeaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(allowedCategories[0]?.value ?? "SaaS");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState<(typeof stages)[number]>("idea");
  const [format, setFormat] = useState<(typeof formats)[number]>("online");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [market, setMarket] = useState("");
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [uploading, setUploading] = useState(false);

  const draftKey = `draft:edit-idea:${id}`;

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
        const r = await fetch(`/api/v1/ideas/${id}`, { cache: "no-store", credentials: "include" });
        if (!r.ok) {
          const j = await r.json().catch(() => null);
          setErr(j?.error ?? "Не удалось загрузить");
          return;
        }
        const data = (await r.json()) as IdeaDetail;
        if (cancelled) return;
        setItem(data);
        setTitle(data.title ?? "");
        setCategory(data.category ?? (allowedCategories[0]?.value ?? "SaaS"));
        setPrice(String(data.price ?? ""));
        setDescription(data.description ?? "");
        setStage((data.stage as any) ?? "idea");
        setFormat((data.format as any) ?? "online");
        setProblem(data.problem ?? "");
        setSolution(data.solution ?? "");
        setMarket(data.market ?? "");
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
    if (analysisIdFromUrl) setAnalysisId(analysisIdFromUrl);
  }, [analysisIdFromUrl]);

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
      if (d?.problem != null) setProblem(String(d.problem));
      if (d?.solution != null) setSolution(String(d.solution));
      if (d?.market != null) setMarket(String(d.market));
      if (Array.isArray(d?.attachments)) setAttachments(d.attachments);
      localStorage.removeItem(draftKey);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canEdit = me && item && (me.role === "admin" || me.id === item.owner.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link href={`/ideas/${id}`} className="text-[var(--accent)] hover:text-white text-sm font-medium">
          ← Назад
        </Link>
      </div>

      <Card className="p-6 md:p-10">
        <h1 className="text-2xl font-semibold text-white">Редактировать идею</h1>

        {loading ? (
          <div className="mt-6 text-[rgba(234,240,255,0.72)]">Загрузка…</div>
        ) : err ? (
          <div className="mt-6 text-sm text-red-300">{err}</div>
        ) : !item ? (
          <div className="mt-6 text-[rgba(234,240,255,0.72)]">Не найдено.</div>
        ) : !canEdit ? (
          <div className="mt-6 text-[rgba(234,240,255,0.72)]">Нет прав на редактирование.</div>
        ) : (
          <form
            className="mt-7 flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              setErr(null);
              try {
                const priceNum = price === "" ? undefined : Number(price);
                const r = await fetch(`/api/v1/ideas/${id}`, {
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
                    analysisId,
                    attachmentIds: attachments.map((a) => a.id),
                    problem: problem || null,
                    solution: solution || null,
                    market: market || null,
                  }),
                });
                const j = await r.json().catch(() => null);
                if (!r.ok) {
                  setErr(j?.error ?? "Не удалось сохранить");
                  return;
                }
                router.push(`/ideas/${id}`);
              } catch {
                setErr("Сетевая ошибка");
              } finally {
                setSaving(false);
              }
            }}
          >
            <div>
              <Input placeholder="Название" value={title} onChange={(e) => setTitle(e.target.value)} />
              <div className="mt-1 text-[10px] text-[rgba(234,240,255,0.55)]">Коротко и понятно: что за идея и для кого.</div>
            </div>

            <label>
              <div className="text-xs text-[rgba(234,240,255,0.72)] mb-1">Категория</div>
              <select
                className="focus-ring [color-scheme:dark] text-white w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {allowedCategories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <Input
                placeholder="Цена (в ₽)"
                value={formatDigitsWithSpaces(price)}
                onChange={(e) => setPrice(stripNonDigits(e.target.value))}
                inputMode="numeric"
              />
              <div className="mt-1 text-[10px] text-[rgba(234,240,255,0.55)]">Если цена неточная — укажи ориентир.</div>
            </div>

            <div>
              <textarea
                className="focus-ring w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm placeholder:text-[rgba(234,240,255,0.45)] min-h-[110px]"
                placeholder="Описание"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="mt-1 text-[10px] text-[rgba(234,240,255,0.55)]">В чём суть идеи, для кого и что хочешь получить.</div>
            </div>

            <div className="flex gap-3">
              <label className="flex-1">
                <div className="text-xs text-[rgba(234,240,255,0.72)] mb-1">Стадия</div>
                <select
                  className="focus-ring [color-scheme:dark] text-white w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm"
                  value={stage}
                  onChange={(e) => setStage(e.target.value as any)}
                >
                  {stages.map((s) => (
                    <option key={s} value={s}>
                      {stageLabelsByLang[lang]?.[s] ?? s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex-1">
                <div className="text-xs text-[rgba(234,240,255,0.72)] mb-1">Формат</div>
                <select
                  className="focus-ring [color-scheme:dark] text-white w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                >
                  {formats.map((f) => (
                    <option key={f} value={f}>
                      {formatLabelsByLang[lang]?.[f] ?? f}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <textarea
              className="focus-ring w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm placeholder:text-[rgba(234,240,255,0.45)] min-h-[90px]"
              placeholder="Проблема (опционально)"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
            />
            <textarea
              className="focus-ring w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm placeholder:text-[rgba(234,240,255,0.45)] min-h-[90px]"
              placeholder="Решение (опционально)"
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
            />
            <textarea
              className="focus-ring w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm placeholder:text-[rgba(234,240,255,0.45)] min-h-[90px]"
              placeholder="Рынок (опционально)"
              value={market}
              onChange={(e) => setMarket(e.target.value)}
            />

            <div className="glass rounded-3xl p-4 border border-[rgba(255,255,255,0.12)]">
              <div className="text-sm font-semibold text-white">Отчёт анализатора</div>
              <div className="mt-2 text-xs text-[rgba(234,240,255,0.72)]">
                Сейчас:{" "}
                <span className="text-white/90">{analysisId ? "прикреплён" : "не прикреплён"}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10"
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
                          attachments,
                        }),
                      );
                    } catch {
                      // ignore
                    }
                    router.push(`/startup-analyzer?mode=idea&returnTo=/ideas/${id}/edit`);
                  }}
                >
                  {analysisId ? "Заменить отчёт" : "Создать и прикрепить отчёт"}
                </Button>
                {analysisId ? (
                  <Button type="button" variant="ghost" className="h-10" onClick={() => setAnalysisId(null)}>
                    Убрать отчёт
                  </Button>
                ) : null}
              </div>
              <div className="mt-2 text-[10px] text-[rgba(234,240,255,0.55)]">
                Изменение отчёта сохраняется после нажатия “Сохранить”.
              </div>
            </div>

            <div className="glass rounded-3xl p-4 border border-[rgba(255,255,255,0.12)]">
              <div className="text-sm font-semibold text-white">Файлы</div>
              <div className="mt-2 text-xs text-[rgba(234,240,255,0.72)]">
                Можно добавлять/убирать вложения.
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <input
                  type="file"
                  multiple
                  onChange={async (e) => {
                    if (!e.target.files || e.target.files.length === 0) return;
                    setUploading(true);
                    setErr(null);
                    try {
                      const uploaded = await uploadFiles(e.target.files);
                      setAttachments((prev) => [...uploaded, ...prev]);
                      e.target.value = "";
                    } catch (err: any) {
                      setErr(err?.message ?? "Не удалось загрузить файлы");
                    } finally {
                      setUploading(false);
                    }
                  }}
                  className="text-sm text-[rgba(234,240,255,0.72)]"
                />
                {uploading ? <div className="text-xs text-[rgba(234,240,255,0.72)]">Загрузка…</div> : null}
                {attachments.length ? (
                  <div className="mt-2 flex flex-col gap-2">
                    {attachments.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-[rgba(255,255,255,0.12)] bg-white/[0.03] px-3 py-2"
                      >
                        <a href={a.url} target="_blank" rel="noreferrer" className="text-xs text-white/90 truncate">
                          {a.filename}
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-8 px-3 text-xs"
                          onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                        >
                          Убрать
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {err ? <div className="text-sm text-red-300">{err}</div> : null}
            <Button type="submit" disabled={saving} className="h-11">
              {saving ? "…" : "Сохранить"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

