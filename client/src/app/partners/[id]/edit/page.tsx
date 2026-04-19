"use client";

import React, { use as useReact, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/i18n/I18nProvider";
import { allowedCategories, asAllowedCategory } from "@/lib/categories";
import { partnerRoleLabelsByLang } from "@/lib/labelMaps";
import type { PartnerProfileExtra } from "@/lib/marketplaceExtras";

const roles = ["supplier", "reseller", "integration", "cofounder"] as const;

type Me = { id: string; role: "user" | "admin" };

type ServiceRow = { title: string; note: string };

type PartnerDetail = {
  id: string;
  role: (typeof roles)[number] | string;
  industry: string;
  description: string;
  author: { id: string };
  profileExtra?: PartnerProfileExtra | null;
};

export default function EditPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { lang } = useI18n();
  const { id } = useReact(params);

  const [me, setMe] = useState<Me | null>(null);
  const [item, setItem] = useState<PartnerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [role, setRole] = useState<(typeof roles)[number]>("supplier");
  const [industry, setIndustry] = useState(allowedCategories[0]?.value ?? "SaaS");
  const [description, setDescription] = useState("");

  const [partnerName, setPartnerName] = useState("");
  const [partnerType, setPartnerType] = useState("");
  const [services, setServices] = useState<ServiceRow[]>([
    { title: "", note: "" },
    { title: "", note: "" },
    { title: "", note: "" },
    { title: "", note: "" },
  ]);
  const [fitForRaw, setFitForRaw] = useState("");
  const [ctaText, setCtaText] = useState("");

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
        const r = await fetch(`/api/v1/partners/${id}`, { cache: "no-store", credentials: "include" });
        if (!r.ok) {
          const j = await r.json().catch(() => null);
          setErr(j?.error ?? "Не удалось загрузить");
          return;
        }
        const data = (await r.json()) as PartnerDetail;
        if (cancelled) return;
        setItem(data);
        setRole((data.role as any) ?? "supplier");
        setIndustry(asAllowedCategory(data.industry ?? (allowedCategories[0]?.value ?? "SaaS")));
        setDescription(data.description ?? "");

        const pe = data.profileExtra ?? null;
        setPartnerName(pe?.partnerName ?? "");
        setPartnerType(pe?.partnerType ?? "");
        const incoming = (pe?.services ?? []).slice(0, 4);
        const next: ServiceRow[] = [...incoming.map((s) => ({ title: s.title, note: s.note ?? "" }))];
        while (next.length < 4) next.push({ title: "", note: "" });
        setServices(next);
        setFitForRaw((pe?.fitFor ?? []).join("\n"));
        setCtaText(pe?.ctaText ?? "Стать партнёром / Получить условия");
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link href={`/partners/${id}`} className="text-[var(--accent)] hover:text-white text-sm font-medium">
          ← Назад
        </Link>
      </div>

      <Card className="p-6 md:p-10">
        <h1 className="text-2xl font-semibold text-white">Редактировать карточку партнёра</h1>

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
                const fitFor = fitForRaw
                  .split("\n")
                  .map((s) => s.replace(/^\s*•\s*/, "").trim())
                  .filter(Boolean)
                  .slice(0, 24);
                const svc = services
                  .map((s) => ({ title: s.title.trim(), note: s.note.trim() || undefined }))
                  .filter((s) => s.title.length > 0);

                const r = await fetch(`/api/v1/partners/${id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    role,
                    industry,
                    description,
                    profileExtra: {
                      partnerName: partnerName.trim() || "Партнёр",
                      partnerType: partnerType.trim() || undefined,
                      services: svc.length ? svc : undefined,
                      fitFor: fitFor.length ? fitFor : undefined,
                      ctaText: ctaText.trim() || undefined,
                    },
                  }),
                });
                const j = await r.json().catch(() => null);
                if (!r.ok) {
                  setErr(j?.error ?? "Не удалось сохранить");
                  return;
                }
                router.push(`/partners/${id}`);
              } catch {
                setErr("Сетевая ошибка");
              } finally {
                setSaving(false);
              }
            }}
          >
            <label className="flex flex-col gap-2">
              <div className="text-xs text-[rgba(234,240,255,0.72)]">Роль (внутренняя)</div>
              <select
                className="focus-ring [color-scheme:dark] text-white w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {partnerRoleLabelsByLang[lang]?.[r] ?? r}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <div className="text-xs text-[rgba(234,240,255,0.72)] mb-1">Название</div>
              <input
                className="focus-ring w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm text-white"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
              />
            </label>
            <label>
              <div className="text-xs text-[rgba(234,240,255,0.72)] mb-1">Тип партнёрства</div>
              <input
                className="focus-ring w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm text-white"
                value={partnerType}
                onChange={(e) => setPartnerType(e.target.value)}
              />
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

            <div>
              <textarea
                className="focus-ring w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm placeholder:text-[rgba(234,240,255,0.45)] min-h-[130px]"
                placeholder="Чем помогаете стартапам"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="text-sm font-semibold text-white">Услуги</div>
            {services.map((row, idx) => (
              <div key={idx} className="grid gap-2 md:grid-cols-2">
                <input
                  className="focus-ring w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm text-white"
                  placeholder="Название"
                  value={row.title}
                  onChange={(e) =>
                    setServices((prev) => prev.map((s, i) => (i === idx ? { ...s, title: e.target.value } : s)))
                  }
                />
                <input
                  className="focus-ring w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm text-white"
                  placeholder="Примечание"
                  value={row.note}
                  onChange={(e) =>
                    setServices((prev) => prev.map((s, i) => (i === idx ? { ...s, note: e.target.value } : s)))
                  }
                />
              </div>
            ))}

            <label>
              <div className="text-xs text-[rgba(234,240,255,0.72)] mb-1">Для кого (строки)</div>
              <textarea
                className="focus-ring w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm placeholder:text-[rgba(234,240,255,0.45)] min-h-[110px]"
                value={fitForRaw}
                onChange={(e) => setFitForRaw(e.target.value)}
              />
            </label>

            <label>
              <div className="text-xs text-[rgba(234,240,255,0.72)] mb-1">Текст кнопки</div>
              <input
                className="focus-ring w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm text-white"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
              />
            </label>

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
