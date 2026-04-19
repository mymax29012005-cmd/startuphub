"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
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
      router.push(`/ideas/${data.id}`);
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Card className="p-6 md:p-10">
        <h1 className="text-2xl font-semibold text-white">Разместить идею</h1>

        {analysisId ? (
          <div className="mt-4 glass rounded-3xl p-4 border border-[rgba(110,168,255,0.25)]">
            <div className="text-sm font-semibold text-white">Прикреплён анализатор</div>
            <div className="mt-1 text-xs text-[rgba(234,240,255,0.72)]">
              ID: <span className="text-[rgba(234,240,255,0.92)]">{analysisId}</span>
              {analysisInfo?.createdAt ? (
                <>
                  {" "}
                  · {new Date(analysisInfo.createdAt).toLocaleString("ru-RU")}
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        <form className="mt-7 flex flex-col gap-4" onSubmit={onSubmit}>
          <div>
            <Input placeholder="Название" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="mt-1 text-[10px] text-[rgba(234,240,255,0.55)]">
              Коротко и понятно: что за идея и для кого (например: “приложение для учёта лекарств”).
            </div>
          </div>

          <label>
            <div className="text-xs text-[rgba(234,240,255,0.72)] mb-1">Категория</div>
            <select
              className="focus-ring [color-scheme:dark] text-white w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm"
              value={category}
              onChange={(e) => setCategory(asAllowedCategory(e.target.value))}
            >
              {allowedCategories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <div className="mt-1 text-[10px] text-[rgba(234,240,255,0.55)]">
              Выбери из списка — так идеи проще искать и сравнивать.
            </div>
          </label>
          <Input
            placeholder="Цена (в ₽)"
            value={formatDigitsWithSpaces(price)}
            onChange={(e) => setPrice(stripNonDigits(e.target.value))}
            inputMode="numeric"
          />
          <div className="text-[10px] text-[rgba(234,240,255,0.55)] -mt-3">
            Если цена пока неизвестна — поставь ориентир (потом можно отредактировать).
          </div>

          <div>
            <textarea
              className="focus-ring w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm placeholder:text-[rgba(234,240,255,0.45)] min-h-[110px]"
              placeholder="Описание"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="mt-1 text-[10px] text-[rgba(234,240,255,0.55)]">
              3–6 предложений: в чём суть идеи, какая проблема, для кого, почему сейчас, и что ты хочешь (инвестор/партнёр/продажа).
            </div>
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

          <Button
            type="button"
            variant="ghost"
            className="h-11"
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
              router.push(`/startup-analyzer?mode=idea&returnTo=/add-idea`);
            }}
          >
            Создать отчёт анализатора
          </Button>

          <div>
            <textarea
              className="focus-ring w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm placeholder:text-[rgba(234,240,255,0.45)] min-h-[90px]"
              placeholder="Проблема (опционально)"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
            />
            <div className="mt-1 text-[10px] text-[rgba(234,240,255,0.55)]">
              Одно-два предложения: какая боль у пользователя и как часто она возникает.
            </div>
          </div>
          <textarea
            className="focus-ring w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm placeholder:text-[rgba(234,240,255,0.45)] min-h-[90px]"
            placeholder="Решение (опционально)"
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
          />
          <div className="text-[10px] text-[rgba(234,240,255,0.55)] -mt-3">
            Как именно ты решаешь проблему (без воды): фичи, процесс, почему это работает.
          </div>
          <textarea
            className="focus-ring w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm placeholder:text-[rgba(234,240,255,0.45)] min-h-[90px]"
            placeholder="Рынок (опционально)"
            value={market}
            onChange={(e) => setMarket(e.target.value)}
          />
          <div className="text-[10px] text-[rgba(234,240,255,0.55)] -mt-3">
            Кто покупатель/пользователь, примерный размер рынка или хотя бы “сколько таких компаний/людей”.
          </div>

          <div className="glass rounded-3xl p-4 border border-[rgba(255,255,255,0.12)]">
            <div className="text-sm font-semibold text-white">Файлы (опционально)</div>
            <div className="mt-2 text-xs text-[rgba(234,240,255,0.72)]">
              Можно прикрепить презентацию, PDF, таблицу и т.д.
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <input
                type="file"
                multiple
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

          {error ? <div className="text-sm text-red-300">{error}</div> : null}
          <Button type="submit" disabled={loading} className="h-11">
            {loading ? "…" : "Создать"}
          </Button>
        </form>
      </Card>
    </div>
  );
}


