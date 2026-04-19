"use client";

import Link from "next/link";
import React, { Suspense, useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useI18n } from "@/i18n/I18nProvider";
import { formatLabelsByLang, stageLabelsByLang } from "@/lib/labelMaps";
import { formatDigitsWithSpaces, stripNonDigits } from "@/lib/numberFormat";
import { allowedCategories, asAllowedCategory } from "@/lib/categories";
import { uploadFiles, type UploadedAttachment } from "@/lib/uploads";
import { addListingFieldClass } from "@/components/forms/addListingFormShell";

const stages = ["idea", "seed", "series_a", "series_b", "growth", "exit"] as const;
const formats = ["online", "offline", "hybrid"] as const;

type MaterialSlot = "pitch" | "excel" | "video" | "other";

export default function AddStartupPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10 text-[rgba(234,240,255,0.72)]">Загрузка…</div>}>
      <AddStartupInner />
    </Suspense>
  );
}

function mergeSlotAttachments(slots: Record<MaterialSlot, UploadedAttachment[]>): UploadedAttachment[] {
  const byId = new Map<string, UploadedAttachment>();
  (Object.keys(slots) as MaterialSlot[]).forEach((k) => {
    slots[k].forEach((a) => byId.set(a.id, a));
  });
  return Array.from(byId.values());
}

function AddStartupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useI18n();

  const analysisId = searchParams.get("analysisId");

  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(allowedCategories[0]?.value ?? "SaaS");
  const [price, setPrice] = useState<string>("");
  const [valuationPreMoney, setValuationPreMoney] = useState<string>("");
  const [equityOfferedPct, setEquityOfferedPct] = useState(18);

  const [stage, setStage] = useState<(typeof stages)[number]>("seed");
  const [format, setFormat] = useState<(typeof formats)[number]>("hybrid");
  const [isOnline, setIsOnline] = useState(true);

  const [kpiRows, setKpiRows] = useState([
    { value: "", label: "" },
    { value: "", label: "" },
    { value: "", label: "" },
  ]);
  const [milestones, setMilestones] = useState("");
  const [teamMembers, setTeamMembers] = useState([{ name: "", role: "" }]);
  const [videoPitchUrl, setVideoPitchUrl] = useState("");

  const [materialSlots, setMaterialSlots] = useState<Record<MaterialSlot, UploadedAttachment[]>>({
    pitch: [],
    excel: [],
    video: [],
    other: [],
  });

  const [withAuction, setWithAuction] = useState(false);
  const [auctionCurrentPrice, setAuctionCurrentPrice] = useState<string>("");
  const [auctionEndsAt, setAuctionEndsAt] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<MaterialSlot | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [analysisInfo, setAnalysisInfo] = useState<null | {
    id: string;
    createdAt: string;
    result?: { riskAvg?: number; valuationLow?: number; valuationHigh?: number; successProbability?: number };
  }>(null);

  const draftKey = "draft:add-startup";

  const allAttachments = useMemo(() => mergeSlotAttachments(materialSlots), [materialSlots]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const d = JSON.parse(raw) as any;
      if (!title && d?.title) setTitle(String(d.title));
      if (d?.tagline != null) setTagline(String(d.tagline));
      if (!description && d?.description) setDescription(String(d.description));
      if (category === (allowedCategories[0]?.value ?? "SaaS") && d?.category) setCategory(asAllowedCategory(String(d.category)));
      if (!price && d?.price) setPrice(String(d.price));
      if (d?.valuationPreMoney != null) setValuationPreMoney(String(d.valuationPreMoney));
      if (typeof d?.equityOfferedPct === "number") setEquityOfferedPct(d.equityOfferedPct);
      if (d?.stage) setStage(d.stage);
      if (d?.format) setFormat(d.format);
      if (typeof d?.isOnline === "boolean") setIsOnline(d.isOnline);
      if (Array.isArray(d?.kpiRows)) setKpiRows(d.kpiRows);
      if (d?.milestones != null) setMilestones(String(d.milestones));
      if (Array.isArray(d?.teamMembers)) setTeamMembers(d.teamMembers);
      if (d?.videoPitchUrl != null) setVideoPitchUrl(String(d.videoPitchUrl));
      if (d?.materialSlots && typeof d.materialSlots === "object") setMaterialSlots(d.materialSlots);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
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

  const draftPayload = useCallback(() => {
    return {
      title,
      tagline,
      description,
      category,
      price,
      valuationPreMoney,
      equityOfferedPct,
      stage,
      format,
      isOnline,
      kpiRows,
      milestones,
      teamMembers,
      videoPitchUrl,
      materialSlots,
    };
  }, [
    title,
    tagline,
    description,
    category,
    price,
    valuationPreMoney,
    equityOfferedPct,
    stage,
    format,
    isOnline,
    kpiRows,
    milestones,
    teamMembers,
    videoPitchUrl,
    materialSlots,
  ]);

  function saveDraftForAnalyzer() {
    try {
      localStorage.setItem(draftKey, JSON.stringify(draftPayload()));
    } catch {
      // ignore
    }
    router.push(`/startup-analyzer?mode=startup&returnTo=/add-startup`);
  }

  async function onSlotFiles(slot: MaterialSlot, files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadingSlot(slot);
    setError(null);
    try {
      const uploaded = await uploadFiles(files);
      setMaterialSlots((prev) => {
        const next = { ...prev };
        if (slot === "pitch" || slot === "excel" || slot === "video") {
          next[slot] = uploaded.slice(0, 1);
        } else {
          next.other = [...uploaded, ...prev.other];
        }
        return next;
      });
    } catch (err: any) {
      setError(err?.message ?? "Не удалось загрузить файлы");
    } finally {
      setUploading(false);
      setUploadingSlot(null);
    }
  }

  function removeFromSlot(slot: MaterialSlot, id: string) {
    setMaterialSlots((prev) => ({
      ...prev,
      [slot]: prev[slot].filter((a) => a.id !== id),
    }));
  }

  function buildProfileExtra() {
    const kpis = kpiRows
      .map((r) => ({
        value: r.value.trim(),
        label: r.label.trim(),
      }))
      .filter((r) => r.value || r.label);
    const team = teamMembers
      .map((t) => ({ name: t.name.trim(), role: t.role.trim() }))
      .filter((t) => t.name && t.role);
    const valuationNum =
      valuationPreMoney === "" || stripNonDigits(valuationPreMoney) === ""
        ? undefined
        : Number(stripNonDigits(valuationPreMoney));
    const out: Record<string, unknown> = {};
    if (tagline.trim()) out.tagline = tagline.trim();
    if (valuationNum !== undefined && Number.isFinite(valuationNum) && valuationNum >= 0) out.valuationPreMoney = valuationNum;
    if (Number.isFinite(equityOfferedPct)) out.equityOfferedPct = equityOfferedPct;
    if (kpis.length) out.kpis = kpis;
    if (milestones.trim()) out.milestones = milestones.trim();
    if (team.length) out.team = team;
    if (videoPitchUrl.trim()) out.videoPitchUrl = videoPitchUrl.trim();
    const pitchId = materialSlots.pitch[0]?.id;
    const excelId = materialSlots.excel[0]?.id;
    const videoId = materialSlots.video[0]?.id;
    const otherIds = materialSlots.other.map((a) => a.id);
    if (pitchId || excelId || videoId || otherIds.length) {
      out.materialSlotIds = {
        ...(pitchId ? { pitchDeckId: pitchId } : {}),
        ...(excelId ? { financialModelId: excelId } : {}),
        ...(videoId ? { videoFileId: videoId } : {}),
        ...(otherIds.length ? { otherIds } : {}),
      };
    }
    return Object.keys(out).length ? out : undefined;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const priceNum = price === "" ? undefined : Number(stripNonDigits(price));
    if (priceNum === undefined || !Number.isFinite(priceNum) || priceNum <= 0) {
      setError("Укажите сумму привлечения (положительное число)");
      setLoading(false);
      return;
    }

    const auctionPriceNum =
      withAuction && auctionCurrentPrice !== "" ? Number(stripNonDigits(auctionCurrentPrice)) : undefined;
    if (withAuction) {
      if (auctionPriceNum === undefined || !Number.isFinite(auctionPriceNum) || auctionPriceNum <= 0) {
        setError("Для аукциона укажите корректную текущую цену");
        setLoading(false);
        return;
      }
      if (!auctionEndsAt) {
        setError("Для аукциона укажите дату и время окончания");
        setLoading(false);
        return;
      }
    }

    const profileExtra = buildProfileExtra();

    try {
      const r = await fetch("/api/v1/startups", {
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
          isOnline,
          profileExtra,
          analysisId: analysisId || undefined,
          attachmentIds: allAttachments.map((a) => a.id),
          auction:
            withAuction && auctionPriceNum != null && auctionEndsAt
              ? {
                  currentPrice: auctionPriceNum,
                  endsAt: new Date(auctionEndsAt),
                }
              : undefined,
        }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        const base = (data?.error as string) ?? "Ошибка при создании";
        const hint = typeof (data as { hint?: unknown }).hint === "string" ? (data as { hint: string }).hint : "";
        setError(hint ? `${base} — ${hint}` : base);
        return;
      }
      try {
        localStorage.removeItem(draftKey);
      } catch {
        // ignore
      }
      router.push(`/startups/${data.id}`);
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass = addListingFieldClass;

  function slotFileList(slot: MaterialSlot) {
    const list = materialSlots[slot];
    if (!list.length) return null;
    return (
      <div className="mt-4 space-y-2">
        {list.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#0A0A0F] px-3 py-2 text-left text-sm text-white/90"
          >
            <span className="truncate">{a.filename}</span>
            <Button type="button" variant="ghost" className="h-8 shrink-0 px-2 text-xs" onClick={() => removeFromSlot(slot, a.id)}>
              Убрать
            </Button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pb-20 pt-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link href="/marketplace?tab=startups" className="text-sm text-gray-400 transition hover:text-white">
          ← В маркетплейс
        </Link>
      </div>

      <h1 className="text-center text-4xl font-bold tracking-tighter text-white md:text-5xl">Создать проект</h1>
      <p className="mb-10 mt-2 text-center text-lg text-gray-400">Все поля после «Основной информации» — опциональные</p>

      <form onSubmit={onSubmit} className="space-y-16 rounded-3xl border border-white/10 bg-[#12121A] p-8 md:p-10">
        {/* 1 */}
        <div>
          <h2 className="mb-8 flex items-center gap-3 text-2xl font-semibold text-white">
            <span className="text-violet-400">1</span> Основная информация
          </h2>
          <div className="space-y-8">
            <div>
              <label className="mb-2 block text-sm text-gray-400">Название проекта</label>
              <input
                className={fieldClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: SalesAI Pro"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-gray-400">Короткое описание</label>
              <input
                className={fieldClass}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="ИИ-платформа для автоматизации продаж"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-gray-400">Полное описание</label>
              <textarea
                className={`${fieldClass} min-h-[140px] rounded-3xl`}
                placeholder="Расскажите подробно: продукт, аудитория, отличия, статус…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <label>
                <div className="mb-2 block text-sm text-gray-400">Отрасль</div>
                <select className={fieldClass} value={category} onChange={(e) => setCategory(asAllowedCategory(e.target.value))}>
                  {allowedCategories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <div className="mb-2 block text-sm text-gray-400">Стадия проекта</div>
                <select className={fieldClass} value={stage} onChange={(e) => setStage(e.target.value as any)}>
                  {stages.map((s) => (
                    <option key={s} value={s}>
                      {stageLabelsByLang[lang]?.[s] ?? s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
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
              <label className="flex cursor-pointer items-center gap-3 self-end pb-2">
                <input type="checkbox" checked={isOnline} onChange={(e) => setIsOnline(e.target.checked)} className="accent-violet-500" />
                <span className="text-sm text-gray-300">Онлайн-проект</span>
              </label>
            </div>
          </div>
        </div>

        {/* 2 */}
        <div>
          <h2 className="mb-8 flex items-center gap-3 text-2xl font-semibold text-white">
            <span className="text-rose-400">2</span> Инвестиционные условия
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-gray-400">Сумма, которую хотите привлечь</label>
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
              <label className="mb-2 block text-sm text-gray-400">Оценка компании (pre-money)</label>
              <div className="flex">
                <input
                  className={`${fieldClass} rounded-r-none border-r-0`}
                  value={formatDigitsWithSpaces(valuationPreMoney)}
                  onChange={(e) => setValuationPreMoney(stripNonDigits(e.target.value))}
                  inputMode="numeric"
                  placeholder="95 000 000"
                />
                <span className="flex items-center rounded-r-2xl border border-l-0 border-white/10 bg-[#1A1A24] px-5 text-gray-400">
                  ₽
                </span>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <label className="mb-3 block text-sm text-gray-400">Какую долю компании готовы отдать?</label>
            <input
              type="range"
              min={5}
              max={40}
              value={equityOfferedPct}
              onChange={(e) => setEquityOfferedPct(Number(e.target.value))}
              className="w-full accent-rose-500"
            />
            <div className="mt-2 flex justify-between text-sm font-medium">
              <span>5%</span>
              <span className="text-rose-400">{equityOfferedPct}%</span>
              <span>40%</span>
            </div>
          </div>
        </div>

        {/* 3 */}
        <div>
          <h2 className="mb-6 flex items-center gap-3 text-2xl font-semibold text-white">
            <span className="text-emerald-400">3</span> Ключевые показатели эффективности{" "}
            <span className="text-xs font-normal text-gray-500">(опционально)</span>
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {kpiRows.map((row, i) => (
              <div key={i}>
                <input
                  className={fieldClass}
                  placeholder={["2.8×", "68%", "1270"][i]}
                  value={row.value}
                  onChange={(e) => {
                    const next = [...kpiRows];
                    next[i] = { ...next[i], value: e.target.value };
                    setKpiRows(next);
                  }}
                />
                <input
                  className={`${fieldClass} mt-3 py-4 text-sm`}
                  placeholder={
                    ["Рост эффективности продаж", "Сокращение времени на обработку лида", "Активных пользователей"][i]
                  }
                  value={row.label}
                  onChange={(e) => {
                    const next = [...kpiRows];
                    next[i] = { ...next[i], label: e.target.value };
                    setKpiRows(next);
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 4 */}
        <div>
          <h2 className="mb-6 flex items-center gap-3 text-2xl font-semibold text-white">
            <span className="text-emerald-400">4</span> Что уже сделано <span className="text-xs font-normal text-gray-500">(опционально)</span>
          </h2>
          <textarea
            className={`${fieldClass} min-h-[140px] rounded-3xl`}
            placeholder="MVP запущен, 1270 пользователей, MRR 840 тыс ₽, интеграции с amoCRM и т.д."
            value={milestones}
            onChange={(e) => setMilestones(e.target.value)}
            rows={5}
          />
        </div>

        {/* 5 */}
        <div>
          <h2 className="mb-6 flex items-center gap-3 text-2xl font-semibold text-white">
            <span className="text-violet-400">5</span> Команда <span className="text-xs font-normal text-gray-500">(опционально)</span>
          </h2>
          <div className="space-y-6">
            {teamMembers.map((m, i) => (
              <div key={i} className="grid gap-6 rounded-3xl bg-[#1A1A24] p-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Имя и фамилия</label>
                  <input
                    className={`${fieldClass} bg-[#0A0A0F]`}
                    placeholder="Иван Петров"
                    value={m.name}
                    onChange={(e) => {
                      const next = [...teamMembers];
                      next[i] = { ...next[i], name: e.target.value };
                      setTeamMembers(next);
                    }}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Должность / роль</label>
                  <input
                    className={`${fieldClass} bg-[#0A0A0F]`}
                    placeholder="Founder & CEO"
                    value={m.role}
                    onChange={(e) => {
                      const next = [...teamMembers];
                      next[i] = { ...next[i], role: e.target.value };
                      setTeamMembers(next);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            className="mt-4 rounded-2xl border border-white/30 px-6 py-3 hover:bg-white/10"
            onClick={() => setTeamMembers((prev) => [...prev, { name: "", role: "" }])}
          >
            + Добавить члена команды
          </Button>
        </div>

        {/* 6 — материалы: 4 слота + анализатор */}
        <div>
          <h2 className="mb-6 flex items-center gap-3 text-2xl font-semibold text-white">
            <span className="text-amber-400">6</span> Материалы проекта <span className="text-xs font-normal text-gray-500">(опционально)</span>
          </h2>
          <div className="mb-6">
            <label className="mb-2 block text-sm text-gray-400">Ссылка на видео-питч (YouTube / Vimeo)</label>
            <input
              className={fieldClass}
              value={videoPitchUrl}
              onChange={(e) => setVideoPitchUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <label className="upload-box cursor-pointer rounded-3xl border-2 border-dashed border-white/30 p-10 text-center">
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                onChange={(e) => {
                  void onSlotFiles("pitch", e.target.files);
                  e.target.value = "";
                }}
              />
              <div className="text-5xl">📕</div>
              <p className="mt-4 font-medium text-white">Pitch Deck (PDF)</p>
              <p className="mt-1 text-xs text-gray-500">Перетащите файл или нажмите</p>
              {uploading && uploadingSlot === "pitch" ? <p className="mt-2 text-xs text-gray-400">Загрузка…</p> : null}
              {slotFileList("pitch")}
            </label>

            <label className="upload-box cursor-pointer rounded-3xl border-2 border-dashed border-white/30 p-10 text-center">
              <input
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="sr-only"
                onChange={(e) => {
                  void onSlotFiles("excel", e.target.files);
                  e.target.value = "";
                }}
              />
              <div className="text-5xl">📊</div>
              <p className="mt-4 font-medium text-white">Финансовая модель (Excel)</p>
              <p className="mt-1 text-xs text-gray-500">Перетащите файл или нажмите</p>
              {uploading && uploadingSlot === "excel" ? <p className="mt-2 text-xs text-gray-400">Загрузка…</p> : null}
              {slotFileList("excel")}
            </label>

            <label className="upload-box cursor-pointer rounded-3xl border-2 border-dashed border-white/30 p-10 text-center">
              <input
                type="file"
                accept="video/*"
                className="sr-only"
                onChange={(e) => {
                  void onSlotFiles("video", e.target.files);
                  e.target.value = "";
                }}
              />
              <div className="text-5xl">🎬</div>
              <p className="mt-4 font-medium text-white">Видео-питч (файл)</p>
              <p className="mt-1 text-xs text-gray-500">Или укажите ссылку выше</p>
              {uploading && uploadingSlot === "video" ? <p className="mt-2 text-xs text-gray-400">Загрузка…</p> : null}
              {slotFileList("video")}
            </label>

            <label className="upload-box cursor-pointer rounded-3xl border-2 border-dashed border-white/30 p-10 text-center">
              <input type="file" multiple className="sr-only" onChange={(e) => void onSlotFiles("other", e.target.files)} />
              <div className="text-5xl">📄</div>
              <p className="mt-4 font-medium text-white">Другие материалы</p>
              <p className="mt-1 text-xs text-gray-500">One-pager, презентации, фото и т.д.</p>
              {uploading && uploadingSlot === "other" ? <p className="mt-2 text-xs text-gray-400">Загрузка…</p> : null}
              {slotFileList("other")}
            </label>

            <div
              className={`upload-box flex flex-col justify-center rounded-3xl border-2 border-dashed p-8 text-center md:col-span-2 ${
                analysisId ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/30"
              }`}
            >
              {analysisId ? (
                <div className="text-left">
                  <div className="text-sm font-semibold text-emerald-400">Результаты анализатора прикреплены</div>
                  <div className="mt-2 text-xs text-gray-400">
                    {analysisInfo?.createdAt ? new Date(analysisInfo.createdAt).toLocaleString("ru-RU") : "Загрузка метаданных…"}
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
                        router.replace("/add-startup");
                        setAnalysisInfo(null);
                      }}
                    >
                      Убрать отчёт
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-5xl">📈</div>
                  <p className="mt-4 font-medium text-white">Результаты анализатора</p>
                  <p className="mt-1 text-xs text-gray-500">Сохраните черновик формы и перейдите в анализатор — отчёт подставится в карточку</p>
                  <Button type="button" className="mt-6 w-full max-w-md self-center rounded-2xl py-4 font-medium" variant="secondary" onClick={saveDraftForAnalyzer}>
                    Создать и прикрепить отчёт
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 7 — аукцион */}
        <div>
          <h2 className="mb-8 flex items-center gap-3 text-2xl font-semibold text-white">
            <span className="text-rose-400">7</span> Аукцион <span className="text-xs font-normal text-gray-500">(опционально)</span>
          </h2>
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={withAuction} onChange={(e) => setWithAuction(e.target.checked)} className="accent-rose-500" />
            <span className="text-sm text-gray-300">Создать активный аукцион сразу</span>
          </label>
          {withAuction ? (
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-gray-400">Текущая цена (₽)</label>
                <Input
                  placeholder="Стартовая ставка"
                  value={formatDigitsWithSpaces(auctionCurrentPrice)}
                  onChange={(e) => setAuctionCurrentPrice(stripNonDigits(e.target.value))}
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">Окончание</label>
                <Input type="datetime-local" value={auctionEndsAt} onChange={(e) => setAuctionEndsAt(e.target.value)} />
              </div>
            </div>
          ) : null}
        </div>

        {error ? <div className="text-sm text-red-300">{error}</div> : null}

        <div className="border-t border-white/10 pt-10">
          <Button
            type="submit"
            disabled={loading || uploading}
            className="w-full rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 py-7 text-xl font-semibold text-white hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "…" : "Опубликовать проект"}
          </Button>
        </div>
      </form>
    </div>
  );
}
