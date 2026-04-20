"use client";

import React, { use as useReact, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AddListingPageChrome, addListingFieldClass } from "@/components/forms/addListingFormShell";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/I18nProvider";
import { formatLabelsByLang, stageLabelsByLang } from "@/lib/labelMaps";
import { allowedCategories, asAllowedCategory } from "@/lib/categories";
import { formatDigitsWithSpaces, stripNonDigits } from "@/lib/numberFormat";
import type { IdeaProfileExtra } from "@/lib/marketplaceExtras";
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
  profileExtra?: IdeaProfileExtra | null;
};

export default function EditIdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useI18n();
  const { id } = useReact(params);

  const analysisIdFromUrl = searchParams.get("analysisId");
  const draftKey = `draft:edit-idea:${id}`;

  const [me, setMe] = useState<Me | null>(null);
  const [item, setItem] = useState<IdeaDetail | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);

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

  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fc = addListingFieldClass;

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
    (async () => {
      setLoadingPage(true);
      setError(null);
      try {
        const r = await fetch(`/api/v1/ideas/${id}`, { cache: "no-store", credentials: "include" });
        if (!r.ok) {
          const j = await r.json().catch(() => null);
          setError(j?.error ?? "Не удалось загрузить");
          return;
        }
        const data = (await r.json()) as IdeaDetail;
        if (cancelled) return;
        setItem(data);
        setTitle(data.title ?? "");
        setDescription(data.description ?? "");
        setCategory(asAllowedCategory(data.category ?? (allowedCategories[0]?.value ?? "SaaS")));
        setPrice(String(data.price ?? ""));
        setStage((data.stage as any) ?? "idea");
        setFormat((data.format as any) ?? "online");
        setProblem(data.problem ?? "");
        setSolution(data.solution ?? "");
        setMarket(data.market ?? "");
        setAnalysisId((data.analysisId as any) ?? null);
        setAttachments((data.attachments as any) ?? []);
        const pe = data.profileExtra ?? null;
        setCity(pe?.city ?? "");
        setDoneItemsRaw((pe?.doneItems ?? []).join("\n"));
        setNeedsText(pe?.needsText ?? "");
        setHelpTagsRaw((pe?.helpTags ?? []).join(", "));
        setCoverGradient((pe?.coverGradient as any) ?? "default");
      } catch {
        setError("Сетевая ошибка");
      } finally {
        if (!cancelled) setLoadingPage(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (analysisIdFromUrl) setAnalysisId(analysisIdFromUrl);
  }, [analysisIdFromUrl]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const d = JSON.parse(raw) as any;
      if (d?.title != null) setTitle(String(d.title));
      if (d?.description != null) setDescription(String(d.description));
      if (d?.category != null) setCategory(asAllowedCategory(String(d.category)));
      if (d?.price != null) setPrice(String(d.price));
      if (d?.stage) setStage(d.stage);
      if (d?.format) setFormat(d.format);
      if (d?.problem != null) setProblem(String(d.problem));
      if (d?.solution != null) setSolution(String(d.solution));
      if (d?.market != null) setMarket(String(d.market));
      if (d?.city != null) setCity(String(d.city));
      if (d?.doneItemsRaw != null) setDoneItemsRaw(String(d.doneItemsRaw));
      if (d?.needsText != null) setNeedsText(String(d.needsText));
      if (d?.helpTagsRaw != null) setHelpTagsRaw(String(d.helpTagsRaw));
      if (d?.coverGradient) setCoverGradient(d.coverGradient);
      if (Array.isArray(d?.attachments)) setAttachments(d.attachments);
      localStorage.removeItem(draftKey);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canEdit = me && item && (me.role === "admin" || me.id === item.owner.id);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    setSaving(true);
    setError(null);

    const priceNum = price === "" ? undefined : Number(stripNonDigits(price));
    if (priceNum !== undefined && !Number.isFinite(priceNum)) {
      setError("Цена должна быть числом");
      setSaving(false);
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

    try {
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
          profileExtra: {
            city: city.trim() || null,
            doneItems: doneItems.length ? doneItems : [],
            needsText: needsText.trim() || null,
            helpTags: helpTags.length ? helpTags : [],
            coverGradient: coverGradient === "default" ? null : coverGradient,
          },
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError((data?.error as string) ?? "Ошибка при сохранении");
        return;
      }
      router.push(`/ideas/${id}`);
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AddListingPageChrome backHref={`/ideas/${id}`} title="Редактировать идею" subtitle="Тот же дизайн, что и при создании">
      {loadingPage ? (
        <div className="text-gray-400">Загрузка…</div>
      ) : error && !item ? (
        <div className="text-red-300">{error}</div>
      ) : !item ? (
        <div className="text-gray-400">Не найдено.</div>
      ) : !canEdit ? (
        <div className="rounded-3xl border border-white/10 bg-[#12121A] p-8 text-gray-300">Нет прав на редактирование.</div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-16 rounded-3xl border border-white/10 bg-[#12121A] p-8 md:p-10">
          <div>
            <h2 className="mb-8 flex items-center gap-3 text-2xl font-semibold text-white">
              <span className="text-violet-400">1</span> Основная информация
            </h2>
            <div className="space-y-8">
              <div>
                <label className="mb-2 block text-sm text-gray-400">Название</label>
                <input className={fc} value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">Описание</label>
                <textarea className={`${fc} min-h-[140px] rounded-3xl`} value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
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
                  <input className={fc} value={formatDigitsWithSpaces(price)} onChange={(e) => setPrice(stripNonDigits(e.target.value))} inputMode="numeric" />
                </label>
              </div>
              <div className="grid gap-8 md:grid-cols-2">
                <label>
                  <div className="mb-2 block text-sm text-gray-400">Стадия</div>
                  <select className={fc} value={stage} onChange={(e) => setStage(e.target.value as any)}>
                    {stages.map((s) => (
                      <option key={s} value={s}>
                        {stageLabelsByLang[lang]?.[s] ?? s}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <div className="mb-2 block text-sm text-gray-400">Формат</div>
                  <select className={fc} value={format} onChange={(e) => setFormat(e.target.value as any)}>
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
                <div className="mt-6 space-y-6">
                  <label>
                    <div className="mb-2 block text-sm text-gray-400">Город</div>
                    <input className={fc} value={city} onChange={(e) => setCity(e.target.value)} />
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
                    <input className={fc} value={helpTagsRaw} onChange={(e) => setHelpTagsRaw(e.target.value)} />
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
                  router.push(`/startup-analyzer?mode=idea&returnTo=/ideas/${id}/edit`);
                }}
              >
                {analysisId ? "Заменить отчёт анализатора" : "Создать отчёт анализатора"}
              </Button>
              {analysisId ? (
                <Button type="button" variant="ghost" className="w-full rounded-2xl py-4 text-base" onClick={() => setAnalysisId(null)}>
                  Убрать отчёт
                </Button>
              ) : null}
              <div>
                <label className="mb-2 block text-sm text-gray-400">Проблема (опционально)</label>
                <textarea className={`${fc} min-h-[100px] rounded-3xl`} value={problem} onChange={(e) => setProblem(e.target.value)} />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">Решение (опционально)</label>
                <textarea className={`${fc} min-h-[100px] rounded-3xl`} value={solution} onChange={(e) => setSolution(e.target.value)} />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">Рынок (опционально)</label>
                <textarea className={`${fc} min-h-[100px] rounded-3xl`} value={market} onChange={(e) => setMarket(e.target.value)} />
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
                    <div key={a.id} className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#12121A] px-3 py-2 text-sm text-white/90">
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
            <Button type="submit" disabled={saving || uploading} className="w-full rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 py-7 text-xl font-semibold text-white hover:brightness-110 disabled:opacity-60">
              {saving ? "…" : "Сохранить изменения"}
            </Button>
          </div>
        </form>
      )}
    </AddListingPageChrome>
  );
}

