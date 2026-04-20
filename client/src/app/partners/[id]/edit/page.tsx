"use client";

import React, { use as useReact, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AddListingPageChrome, addListingFieldClass } from "@/components/forms/addListingFormShell";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/I18nProvider";
import { partnerRoleLabelsByLang } from "@/lib/labelMaps";
import { allowedCategories, asAllowedCategory } from "@/lib/categories";
import { uploadFiles, type UploadedAttachment } from "@/lib/uploads";
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
  attachments?: UploadedAttachment[];
  profileExtra?: PartnerProfileExtra | null;
};

export default function EditPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { lang } = useI18n();
  const fc = addListingFieldClass;

  const { id } = useReact(params);

  const [me, setMe] = useState<Me | null>(null);
  const [item, setItem] = useState<PartnerDetail | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);

  const [role, setRole] = useState<(typeof roles)[number]>("supplier");
  const [industry, setIndustry] = useState(allowedCategories[0]?.value ?? "SaaS");

  const [partnerName, setPartnerName] = useState("");
  const [partnerType, setPartnerType] = useState("");
  const [description, setDescription] = useState("");

  const [services, setServices] = useState<ServiceRow[]>([{ title: "", note: "" }]);
  const [fitForRaw, setFitForRaw] = useState("");
  const [ctaText, setCtaText] = useState("Стать партнёром / Получить условия");

  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
        const r = await fetch(`/api/v1/partners/${id}`, { cache: "no-store", credentials: "include" });
        if (!r.ok) {
          const j = await r.json().catch(() => null);
          setError(j?.error ?? "Не удалось загрузить");
          return;
        }
        const data = (await r.json()) as PartnerDetail;
        if (cancelled) return;
        setItem(data);
        setRole((roles as readonly string[]).includes(String(data.role)) ? (data.role as (typeof roles)[number]) : "supplier");
        setIndustry(asAllowedCategory(data.industry ?? (allowedCategories[0]?.value ?? "SaaS")));
        setDescription(data.description ?? "");
        setAttachments(data.attachments ?? []);
        const pe = data.profileExtra ?? null;
        setPartnerName(pe?.partnerName ?? "");
        setPartnerType(pe?.partnerType ?? "");
        const incoming = (pe?.services ?? []).map((s) => ({ title: s.title, note: s.note ?? "" })).filter((s) => s.title.trim());
        setServices(incoming.length ? incoming : [{ title: "", note: "" }]);
        setFitForRaw((pe?.fitFor ?? []).join("\n"));
        setCtaText(pe?.ctaText ?? "Стать партнёром / Получить условия");
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    setSaving(true);
    setError(null);

    const fitFor = fitForRaw
      .split("\n")
      .map((s) => s.replace(/^\s*•\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 24);

    const svc = services
      .map((s) => ({ title: s.title.trim(), note: s.note.trim() || undefined }))
      .filter((s) => s.title.length > 0);

    try {
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
          attachmentIds: attachments.map((a) => a.id),
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError((data?.error as string) ?? "Ошибка при сохранении");
        return;
      }
      router.push(`/partners/${id}`);
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AddListingPageChrome backHref={`/partners/${id}`} title="Редактировать партнёра" subtitle="Тот же дизайн, что и при создании">
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
              <span className="text-violet-400">1</span> Организация и позиционирование
            </h2>
            <div className="space-y-8">
              <div className="grid gap-8 md:grid-cols-2">
                <label>
                  <div className="mb-2 block text-sm text-gray-400">Название</div>
                  <input className={fc} value={partnerName} onChange={(e) => setPartnerName(e.target.value)} />
                </label>
                <label>
                  <div className="mb-2 block text-sm text-gray-400">Тип партнёрства</div>
                  <input className={fc} value={partnerType} onChange={(e) => setPartnerType(e.target.value)} />
                </label>
              </div>
              <label>
                <div className="mb-2 block text-sm text-gray-400">Роль в запросе (внутренняя классификация)</div>
                <select className={fc} value={role} onChange={(e) => setRole(e.target.value as (typeof roles)[number])}>
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {partnerRoleLabelsByLang[lang]?.[r] ?? r}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <div className="mb-2 block text-sm text-gray-400">Категория / отрасль</div>
                <select className={fc} value={industry} onChange={(e) => setIndustry(asAllowedCategory(e.target.value))}>
                  {allowedCategories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <div className="mb-2 block text-sm text-gray-400">Чем вы помогаете стартапам</div>
                <textarea className={`${fc} min-h-[160px] rounded-3xl`} value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />
              </label>
            </div>
          </div>

          <div>
            <h2 className="mb-8 flex items-center gap-3 text-2xl font-semibold text-white">
              <span className="text-cyan-400">2</span> Доступные услуги
            </h2>
            <div className="space-y-6">
              {services.map((row, idx) => (
                <div key={idx} className="rounded-3xl border border-white/10 bg-[#0A0A0F] p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white/90">Услуга {idx + 1}</div>
                    {idx > 0 ? (
                      <Button type="button" variant="ghost" className="h-8 px-3 text-xs" onClick={() => setServices((prev) => prev.filter((_, i) => i !== idx))}>
                        Удалить
                      </Button>
                    ) : null}
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <label>
                      <div className="mb-2 block text-xs text-gray-400">Название</div>
                      <input
                        className={fc}
                        value={row.title}
                        onChange={(e) => setServices((prev) => prev.map((s, i) => (i === idx ? { ...s, title: e.target.value } : s)))}
                      />
                    </label>
                    <label>
                      <div className="mb-2 block text-xs text-gray-400">Условия / примечание</div>
                      <input
                        className={fc}
                        value={row.note}
                        onChange={(e) => setServices((prev) => prev.map((s, i) => (i === idx ? { ...s, note: e.target.value } : s)))}
                      />
                    </label>
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <Button type="button" variant="secondary" className="w-full rounded-2xl py-4 text-base" onClick={() => setServices((prev) => [...prev, { title: "", note: "" }])} disabled={services.length >= 20}>
                  Добавить услугу
                </Button>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-8 flex items-center gap-3 text-2xl font-semibold text-white">
              <span className="text-emerald-400">3</span> Для кого вы подходите
            </h2>
            <label>
              <div className="mb-2 block text-sm text-gray-400">Список (каждая строка — пункт)</div>
              <textarea className={`${fc} min-h-[140px] rounded-3xl`} value={fitForRaw} onChange={(e) => setFitForRaw(e.target.value)} rows={6} />
            </label>
            <label className="mt-8 block">
              <div className="mb-2 block text-sm text-gray-400">Текст на кнопке (на странице карточки)</div>
              <input className={fc} value={ctaText} onChange={(e) => setCtaText(e.target.value)} />
            </label>
          </div>

          <div>
            <h2 className="mb-8 flex items-center gap-3 text-2xl font-semibold text-white">
              <span className="text-rose-400">4</span> Файлы
            </h2>
            <div className="rounded-3xl border border-white/10 bg-[#0A0A0F] p-6">
              <p className="text-sm text-gray-400">Презентация условий, PDF — опционально.</p>
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
