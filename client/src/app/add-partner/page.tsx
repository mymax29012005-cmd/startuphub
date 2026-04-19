"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { AddListingPageChrome, addListingFieldClass } from "@/components/forms/addListingFormShell";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/I18nProvider";
import { partnerRoleLabelsByLang } from "@/lib/labelMaps";
import { allowedCategories, asAllowedCategory } from "@/lib/categories";
import { uploadFiles, type UploadedAttachment } from "@/lib/uploads";

const roles = ["supplier", "reseller", "integration", "cofounder"] as const;

export default function AddPartnerPage() {
  const router = useRouter();
  const { lang } = useI18n();
  const fc = addListingFieldClass;

  const [role, setRole] = useState<(typeof roles)[number]>("supplier");
  const [industry, setIndustry] = useState(allowedCategories[0]?.value ?? "SaaS");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/v1/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          role,
          industry,
          description,
          attachmentIds: attachments.map((a) => a.id),
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError((data?.error as string) ?? "Ошибка при создании");
        return;
      }
      router.push("/marketplace?tab=partners");
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AddListingPageChrome
      backHref="/marketplace?tab=partners"
      title="Запрос партнёра"
      subtitle="Оформление как у карточки стартапа"
    >
      <form onSubmit={onSubmit} className="space-y-16 rounded-3xl border border-white/10 bg-[#12121A] p-8 md:p-10">
        <div>
          <h2 className="mb-8 flex items-center gap-3 text-2xl font-semibold text-white">
            <span className="text-violet-400">1</span> Основная информация
          </h2>
          <div className="space-y-8">
            <label>
              <div className="mb-2 block text-sm text-gray-400">Роль</div>
              <select className={fc} value={role} onChange={(e) => setRole(e.target.value as (typeof roles)[number])}>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {partnerRoleLabelsByLang[lang]?.[r] ?? r}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-gray-500">Кого ищете: поставщика, реселлера, интеграцию или кофаундера.</p>
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
              <div className="mb-2 block text-sm text-gray-400">Описание запроса</div>
              <textarea
                className={`${fc} min-h-[160px] rounded-3xl`}
                placeholder="Задача, условия, что предлагаете взамен…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
              />
            </label>
          </div>
        </div>

        <div>
          <h2 className="mb-8 flex items-center gap-3 text-2xl font-semibold text-white">
            <span className="text-emerald-400">2</span> Файлы
          </h2>
          <div className="rounded-3xl border border-white/10 bg-[#0A0A0F] p-6">
            <p className="text-sm text-gray-400">Документы по проекту — опционально.</p>
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
            {loading ? "…" : "Опубликовать запрос"}
          </Button>
        </div>
      </form>
    </AddListingPageChrome>
  );
}
