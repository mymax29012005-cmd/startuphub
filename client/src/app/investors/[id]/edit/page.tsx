"use client";

import React, { use as useReact, useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AddListingPageChrome, addListingFieldClass } from "@/components/forms/addListingFormShell";
import { Button } from "@/components/ui/Button";
import { formatDigitsWithSpaces, stripNonDigits } from "@/lib/numberFormat";
import { allowedCategories, asAllowedCategory } from "@/lib/categories";
import { useI18n } from "@/i18n/I18nProvider";
import { stageLabelsByLang } from "@/lib/labelMaps";
import { uploadFiles, type UploadedAttachment } from "@/lib/uploads";
import type { InvestorProfileExtra } from "@/lib/marketplaceExtras";

const stages = ["idea", "seed", "series_a", "series_b", "growth", "exit"] as const;
type InvestorStage = (typeof stages)[number];

type Me = { id: string; role: "user" | "admin" };

type InvestorDetail = {
  id: string;
  industry: string;
  description: string;
  amount: number;
  status: "active" | "paused" | "closed";
  author: { id: string; name?: string };
  attachments?: UploadedAttachment[];
  profileExtra?: InvestorProfileExtra | null;
};

export default function EditInvestorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { lang } = useI18n();
  const fc = addListingFieldClass;

  const { id } = useReact(params);

  const [me, setMe] = useState<Me | null>(null);
  const [item, setItem] = useState<InvestorDetail | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);

  const [investorName, setInvestorName] = useState("");
  const [investorTitle, setInvestorTitle] = useState("");
  const [industry, setIndustry] = useState(allowedCategories[0]?.value ?? "SaaS");
  const [description, setDescription] = useState("");

  const [checkMin, setCheckMin] = useState("");
  const [checkMax, setCheckMax] = useState("");
  const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set(["idea", "seed"]));
  const [dealsCount, setDealsCount] = useState("");
  const [exitsCount, setExitsCount] = useState("");
  const [interestsRaw, setInterestsRaw] = useState("");

  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const interests = useMemo(() => {
    return interestsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 24);
  }, [interestsRaw]);

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
        const r = await fetch(`/api/v1/investors/${id}`, { cache: "no-store", credentials: "include" });
        if (!r.ok) {
          const j = await r.json().catch(() => null);
          setError(j?.error ?? "Не удалось загрузить");
          return;
        }
        const data = (await r.json()) as InvestorDetail;
        if (cancelled) return;
        setItem(data);
        setIndustry(asAllowedCategory(data.industry ?? (allowedCategories[0]?.value ?? "SaaS")));
        setDescription(data.description ?? "");
        setAttachments(data.attachments ?? []);
        const pe = data.profileExtra ?? null;
        setInvestorName(pe?.investorName ?? "");
        setInvestorTitle(pe?.investorTitle ?? "");
        setCheckMin(pe?.checkMin != null ? String(pe.checkMin) : "");
        setCheckMax(pe?.checkMax != null ? String(pe.checkMax) : "");
        setSelectedStages(new Set((pe?.stages as string[] | undefined) ?? []));
        setDealsCount(pe?.dealsCount != null ? String(pe.dealsCount) : "");
        setExitsCount(pe?.exitsCount != null ? String(pe.exitsCount) : "");
        setInterestsRaw((pe?.interests ?? []).join(", "));
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

  const canEdit = me && item && (me.role === "admin" || me.id === item.author.id);

  function toggleStage(s: (typeof stages)[number]) {
    setSelectedStages((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    setSaving(true);
    setError(null);

    const minN = checkMin === "" ? undefined : Number(stripNonDigits(checkMin));
    const maxN = checkMax === "" ? undefined : Number(stripNonDigits(checkMax));
    if (minN !== undefined && !Number.isFinite(minN)) {
      setError("Нижняя граница чека должна быть числом");
      setSaving(false);
      return;
    }
    if (maxN !== undefined && !Number.isFinite(maxN)) {
      setError("Верхняя граница чека должна быть числом");
      setSaving(false);
      return;
    }
    if (minN != null && maxN != null && minN > maxN) {
      setError("В чеке: «от» не может быть больше «до»");
      setSaving(false);
      return;
    }

    const dealsN = dealsCount === "" ? undefined : Number(dealsCount);
    const exitsN = exitsCount === "" ? undefined : Number(exitsCount);
    if (dealsN !== undefined && !Number.isFinite(dealsN)) {
      setError("Количество сделок — число");
      setSaving(false);
      return;
    }
    if (exitsN !== undefined && !Number.isFinite(exitsN)) {
      setError("Количество выходов — число");
      setSaving(false);
      return;
    }

    const amountForFilter = Math.max(1, maxN ?? minN ?? 1);

    try {
      const r = await fetch(`/api/v1/investors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          industry,
          description,
          amount: amountForFilter,
          profileExtra: {
            investorName: investorName.trim() || "Инвестор",
            investorTitle: investorTitle.trim() || undefined,
            checkMin: minN,
            checkMax: maxN,
            stages: Array.from(selectedStages) as InvestorStage[],
            dealsCount: dealsN,
            exitsCount: exitsN,
            interests: interests.length ? interests : undefined,
          },
          attachmentIds: attachments.map((a) => a.id),
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError((data?.error as string) ?? "Ошибка при сохранении");
        return;
      }
      router.push(`/investors/${id}`);
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AddListingPageChrome backHref={`/investors/${id}`} title="Редактировать инвестора" subtitle="Тот же дизайн, что и при создании">
      {!loadingPage && !error && item && !canEdit ? (
        <div className="rounded-3xl border border-white/10 bg-[#12121A] p-8 text-gray-300">
          Нет прав на редактирование.
        </div>
      ) : null}

      {loadingPage ? (
        <div className="text-gray-400">Загрузка…</div>
      ) : error && !item ? (
        <div className="text-red-300">{error}</div>
      ) : !item ? (
        <div className="text-gray-400">Не найдено.</div>
      ) : canEdit ? (
        <form onSubmit={onSubmit} className="space-y-16 rounded-3xl border border-white/10 bg-[#12121A] p-8 md:p-10">
          <div>
            <h2 className="mb-8 flex items-center gap-3 text-2xl font-semibold text-white">
              <span className="text-violet-400">1</span> Лицо и фокус
            </h2>
            <div className="space-y-8">
              <div className="grid gap-8 md:grid-cols-2">
                <label>
                  <div className="mb-2 block text-sm text-gray-400">Имя / как представиться</div>
                  <input className={fc} value={investorName} onChange={(e) => setInvestorName(e.target.value)} placeholder="Например: Алексей Морозов" />
                </label>
                <label>
                  <div className="mb-2 block text-sm text-gray-400">Статус / роль</div>
                  <input className={fc} value={investorTitle} onChange={(e) => setInvestorTitle(e.target.value)} placeholder="Например: Angel Investor" />
                </label>
              </div>
              <label>
                <div className="mb-2 block text-sm text-gray-400">Категория фокуса</div>
                <select className={fc} value={industry} onChange={(e) => setIndustry(asAllowedCategory(e.target.value))}>
                  {allowedCategories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <div className="mb-2 block text-sm text-gray-400">Обо мне</div>
                <textarea className={`${fc} min-h-[160px] rounded-3xl`} value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />
              </label>
            </div>
          </div>

          <div>
            <h2 className="mb-8 flex items-center gap-3 text-2xl font-semibold text-white">
              <span className="text-emerald-400">2</span> Деньги и опыт
            </h2>
            <div className="space-y-8">
              <div className="grid gap-8 md:grid-cols-2">
                <label>
                  <div className="mb-2 block text-sm text-gray-400">Чек от (₽)</div>
                  <input className={fc} value={formatDigitsWithSpaces(checkMin)} onChange={(e) => setCheckMin(stripNonDigits(e.target.value))} inputMode="numeric" />
                </label>
                <label>
                  <div className="mb-2 block text-sm text-gray-400">Чек до (₽)</div>
                  <input className={fc} value={formatDigitsWithSpaces(checkMax)} onChange={(e) => setCheckMax(stripNonDigits(e.target.value))} inputMode="numeric" />
                </label>
              </div>
              <div>
                <div className="mb-3 block text-sm text-gray-400">Стадии</div>
                <div className="flex flex-wrap gap-2">
                  {stages.map((s) => {
                    const on = selectedStages.has(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleStage(s)}
                        className={[
                          "rounded-2xl px-4 py-2 text-sm transition",
                          on ? "bg-emerald-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/15",
                        ].join(" ")}
                      >
                        {stageLabelsByLang[lang]?.[s] ?? s}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid gap-8 md:grid-cols-2">
                <label>
                  <div className="mb-2 block text-sm text-gray-400">Количество сделок</div>
                  <input className={fc} value={dealsCount} onChange={(e) => setDealsCount(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
                </label>
                <label>
                  <div className="mb-2 block text-sm text-gray-400">Успешных выходов</div>
                  <input className={fc} value={exitsCount} onChange={(e) => setExitsCount(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
                </label>
              </div>
              <label>
                <div className="mb-2 block text-sm text-gray-400">Интересы (через запятую)</div>
                <input className={fc} value={interestsRaw} onChange={(e) => setInterestsRaw(e.target.value)} />
              </label>
            </div>
          </div>

          <div>
            <h2 className="mb-8 flex items-center gap-3 text-2xl font-semibold text-white">
              <span className="text-cyan-400">3</span> Файлы
            </h2>
            <div className="rounded-3xl border border-white/10 bg-[#0A0A0F] p-6">
              <p className="text-sm text-gray-400">Портфолио, тезисы, PDF — по желанию.</p>
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
      ) : null}
    </AddListingPageChrome>
  );
}
