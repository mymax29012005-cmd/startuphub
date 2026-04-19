"use client";

import React, { use as useReact, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { allowedCategories, asAllowedCategory } from "@/lib/categories";
import { useI18n } from "@/i18n/I18nProvider";
import { stageLabelsByLang } from "@/lib/labelMaps";
import { formatDigitsWithSpaces, stripNonDigits } from "@/lib/numberFormat";
import type { InvestorProfileExtra } from "@/lib/marketplaceExtras";

type Me = { id: string; role: "user" | "admin" };

type InvestorDetail = {
  id: string;
  industry: string;
  description: string;
  amount: number;
  status: "active" | "paused" | "closed";
  author: { id: string };
  profileExtra?: InvestorProfileExtra | null;
};

const stages = ["idea", "seed", "series_a", "series_b", "growth", "exit"] as const;

export default function EditInvestorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { lang } = useI18n();
  const { id } = useReact(params);

  const [me, setMe] = useState<Me | null>(null);
  const [item, setItem] = useState<InvestorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [industry, setIndustry] = useState(allowedCategories[0]?.value ?? "SaaS");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<InvestorDetail["status"]>("active");

  const [investorName, setInvestorName] = useState("");
  const [investorTitle, setInvestorTitle] = useState("");
  const [checkMin, setCheckMin] = useState("");
  const [checkMax, setCheckMax] = useState("");
  const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set());
  const [dealsCount, setDealsCount] = useState("");
  const [exitsCount, setExitsCount] = useState("");
  const [interestsRaw, setInterestsRaw] = useState("");

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
        const r = await fetch(`/api/v1/investors/${id}`, { cache: "no-store", credentials: "include" });
        if (!r.ok) {
          const j = await r.json().catch(() => null);
          setErr(j?.error ?? "Не удалось загрузить");
          return;
        }
        const data = (await r.json()) as InvestorDetail;
        if (cancelled) return;
        setItem(data);
        setIndustry(asAllowedCategory(data.industry ?? (allowedCategories[0]?.value ?? "SaaS")));
        setAmount(String(data.amount ?? ""));
        setDescription(data.description ?? "");
        setStatus((data.status as any) ?? "active");

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

  const canEdit = me && item && (me.role === "admin" || me.id === item.author.id);

  function toggleStage(s: (typeof stages)[number]) {
    setSelectedStages((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link href={`/investors/${id}`} className="text-[var(--accent)] hover:text-white text-sm font-medium">
          ← Назад
        </Link>
      </div>

      <Card className="p-6 md:p-10">
        <h1 className="text-2xl font-semibold text-white">Редактировать профиль инвестора</h1>

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
                const minN = checkMin === "" ? undefined : Number(stripNonDigits(checkMin));
                const maxN = checkMax === "" ? undefined : Number(stripNonDigits(checkMax));
                if (minN !== undefined && !Number.isFinite(minN)) {
                  setErr("Чек «от» должен быть числом");
                  setSaving(false);
                  return;
                }
                if (maxN !== undefined && !Number.isFinite(maxN)) {
                  setErr("Чек «до» должен быть числом");
                  setSaving(false);
                  return;
                }
                if (minN != null && maxN != null && minN > maxN) {
                  setErr("В чеке: «от» не может быть больше «до»");
                  setSaving(false);
                  return;
                }

                const amountNumRaw = amount === "" ? undefined : Number(stripNonDigits(amount));
                const amountForFilter = Math.max(
                  1,
                  amountNumRaw && Number.isFinite(amountNumRaw) ? amountNumRaw : maxN ?? minN ?? 1,
                );

                const dealsN = dealsCount === "" ? undefined : Number(dealsCount);
                const exitsN = exitsCount === "" ? undefined : Number(exitsCount);
                const interests = interestsRaw
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .slice(0, 24);

                const r = await fetch(`/api/v1/investors/${id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    industry,
                    description,
                    amount: amountForFilter,
                    status,
                    profileExtra: {
                      investorName: investorName.trim() || "Инвестор",
                      investorTitle: investorTitle.trim() || undefined,
                      checkMin: minN,
                      checkMax: maxN,
                      stages: Array.from(selectedStages) as any[],
                      dealsCount: dealsN,
                      exitsCount: exitsN,
                      interests: interests.length ? interests : undefined,
                    },
                  }),
                });
                const j = await r.json().catch(() => null);
                if (!r.ok) {
                  setErr(j?.error ?? "Не удалось сохранить");
                  return;
                }
                router.push(`/investors/${id}`);
              } catch {
                setErr("Сетевая ошибка");
              } finally {
                setSaving(false);
              }
            }}
          >
            <label>
              <div className="text-xs text-[rgba(234,240,255,0.72)] mb-1">Имя</div>
              <Input placeholder="Имя" value={investorName} onChange={(e) => setInvestorName(e.target.value)} />
            </label>
            <label>
              <div className="text-xs text-[rgba(234,240,255,0.72)] mb-1">Статус / роль</div>
              <Input placeholder="Angel Investor" value={investorTitle} onChange={(e) => setInvestorTitle(e.target.value)} />
            </label>

            <label>
              <div className="text-xs text-[rgba(234,240,255,0.72)] mb-1">Индустрия</div>
              <select
                className="focus-ring [color-scheme:dark] text-white w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm"
                value={industry}
                onChange={(e) => setIndustry(asAllowedCategory(e.target.value))}
              >
                {allowedCategories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs text-[rgba(234,240,255,0.72)] mb-1">Чек от (₽)</div>
                <Input
                  placeholder="от"
                  value={formatDigitsWithSpaces(checkMin)}
                  onChange={(e) => setCheckMin(stripNonDigits(e.target.value))}
                  inputMode="numeric"
                />
              </div>
              <div>
                <div className="text-xs text-[rgba(234,240,255,0.72)] mb-1">Чек до (₽)</div>
                <Input
                  placeholder="до"
                  value={formatDigitsWithSpaces(checkMax)}
                  onChange={(e) => setCheckMax(stripNonDigits(e.target.value))}
                  inputMode="numeric"
                />
              </div>
            </div>

            <div>
              <div className="text-xs text-[rgba(234,240,255,0.72)] mb-2">Стадии</div>
              <div className="flex flex-wrap gap-2">
                {stages.map((s) => {
                  const on = selectedStages.has(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleStage(s)}
                      className={[
                        "rounded-2xl px-3 py-2 text-xs transition",
                        on ? "bg-emerald-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/15",
                      ].join(" ")}
                    >
                      {stageLabelsByLang[lang]?.[s] ?? s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs text-[rgba(234,240,255,0.72)] mb-1">Сделок</div>
                <Input value={dealsCount} onChange={(e) => setDealsCount(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
              </div>
              <div>
                <div className="text-xs text-[rgba(234,240,255,0.72)] mb-1">Выходов</div>
                <Input value={exitsCount} onChange={(e) => setExitsCount(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
              </div>
            </div>

            <label>
              <div className="text-xs text-[rgba(234,240,255,0.72)] mb-1">Интересы (через запятую)</div>
              <Input value={interestsRaw} onChange={(e) => setInterestsRaw(e.target.value)} />
            </label>

            <div>
              <Input
                placeholder="Сумма для фильтра маркетплейса (₽), опционально"
                value={formatDigitsWithSpaces(amount)}
                onChange={(e) => setAmount(stripNonDigits(e.target.value))}
                inputMode="numeric"
              />
              <div className="mt-1 text-[10px] text-[rgba(234,240,255,0.55)]">
                Если пусто — возьмём верхнюю границу чека (или нижнюю) для фильтра «сумма».
              </div>
            </div>

            <label>
              <div className="text-xs text-[rgba(234,240,255,0.72)] mb-1">Статус публикации</div>
              <select
                className="focus-ring [color-scheme:dark] text-white w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="active">Активный</option>
                <option value="paused">Пауза</option>
                <option value="closed">Закрыт</option>
              </select>
            </label>

            <div>
              <textarea
                className="focus-ring w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm placeholder:text-[rgba(234,240,255,0.45)] min-h-[130px]"
                placeholder="Обо мне"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
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
