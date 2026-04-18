"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/i18n/I18nProvider";
import { partnerRoleLabelsByLang } from "@/lib/labelMaps";
import { allowedCategories } from "@/lib/categories";
import { uploadFiles, type UploadedAttachment } from "@/lib/uploads";

const roles = ["supplier", "reseller", "integration", "cofounder"] as const;

export default function AddPartnerPage() {
  const router = useRouter();
  const { lang } = useI18n();

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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Card className="p-6 md:p-10">
        <h1 className="text-2xl font-semibold text-white">Разместить запрос партнёра</h1>

        <form className="mt-7 flex flex-col gap-4" onSubmit={onSubmit}>
          <label className="flex flex-col gap-2">
            <div className="text-xs text-[rgba(234,240,255,0.72)]">Роль</div>
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
            <div className="text-[10px] text-[rgba(234,240,255,0.55)]">
              Кого ищете: поставщика/реселлера/интеграцию/кофаундера.
            </div>
          </label>
          <label>
            <div className="text-xs text-[rgba(234,240,255,0.72)] mb-1">Индустрия</div>
            <select
              className="focus-ring [color-scheme:dark] text-white w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            >
              {allowedCategories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <div className="mt-1 text-[10px] text-[rgba(234,240,255,0.55)]">Выбирай из списка — так проще фильтровать.</div>
          </label>
          <textarea
            className="focus-ring w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm placeholder:text-[rgba(234,240,255,0.45)] min-h-[130px]"
            placeholder="Описание запроса"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="text-[10px] text-[rgba(234,240,255,0.55)] -mt-3">
            Что за проект/задача, кого именно ищете, условия и что предлагаете.
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
            {loading ? "…" : "Опубликовать"}
          </Button>
        </form>
      </Card>
    </div>
  );
}


