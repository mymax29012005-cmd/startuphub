"use client";

import React, { use as useReact, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { IndustryPickers } from "@/components/forms/IndustryPickers";
import { useI18n } from "@/i18n/I18nProvider";
import { INDUSTRY_CATEGORIES_BY_SECTOR, INDUSTRY_SECTORS, normalizeIndustryPair, type SectorId } from "@/lib/industryHierarchy";
import { formatLabelsByLang, stageLabelsByLang } from "@/lib/labelMaps";
import { formatDigitsWithSpaces, stripNonDigits } from "@/lib/numberFormat";
import { uploadFiles, type UploadedAttachment } from "@/lib/uploads";

const stages = ["idea", "seed", "series_a", "series_b", "growth", "exit"] as const;
const formats = ["online", "offline", "hybrid"] as const;
const listingTypes = ["investment", "sale"] as const;
const defaultSector = INDUSTRY_SECTORS[0]!.id as SectorId;
const defaultCategory = INDUSTRY_CATEGORIES_BY_SECTOR[defaultSector][0]!.id;
type Stage = (typeof stages)[number];
type Format = (typeof formats)[number];
type ListingType = (typeof listingTypes)[number];

type StartupProfileExtra = {
  tagline?: string;
  valuationPreMoney?: number;
  equityOfferedPct?: number;
  locationAddress?: string;
  kpis?: Array<{ value?: string; label?: string }>;
  milestones?: string;
  team?: Array<{ name: string; role: string }>;
  videoPitchUrl?: string;
  materialSlotIds?: {
    pitchDeckId?: string | null;
    financialModelId?: string | null;
    videoFileId?: string | null;
    otherIds?: string[];
  };
};

function asStage(v: unknown, fallback: Stage): Stage {
  return typeof v === "string" && (stages as readonly string[]).includes(v) ? (v as Stage) : fallback;
}
function asFormat(v: unknown, fallback: Format): Format {
  return typeof v === "string" && (formats as readonly string[]).includes(v) ? (v as Format) : fallback;
}
function asListingType(v: unknown, fallback: ListingType): ListingType {
  return typeof v === "string" && (listingTypes as readonly string[]).includes(v) ? (v as ListingType) : fallback;
}
type MaterialSlot = "pitch" | "excel" | "video" | "other";

function mergeSlotAttachments(slots: Record<MaterialSlot, UploadedAttachment[]>): UploadedAttachment[] {
  const byId = new Map<string, UploadedAttachment>();
  (Object.keys(slots) as MaterialSlot[]).forEach((k) => {
    slots[k].forEach((a) => byId.set(a.id, a));
  });
  return Array.from(byId.values());
}

type Me = { id: string; role: "user" | "admin" };

type StartupDetail = {
  id: string;
  title: string;
  description: string;
  sector?: string;
  category: string;
  price: number;
  stage: Stage;
  format: Format;
  listingType?: ListingType;
  isOnline: boolean;
  analysisId?: string | null;
  attachments?: UploadedAttachment[];
  profileExtra?: StartupProfileExtra | null;
  auction?: null | { currentPrice: number; endsAt: string };
  owner: { id: string };
};

export default function EditStartupPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useI18n();
  const { id } = useReact(params);
  const returnTo = searchParams.get("returnTo");

  const analysisIdFromUrl = searchParams.get("analysisId");

  const [me, setMe] = useState<Me | null>(null);
  const [item, setItem] = useState<StartupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [sector, setSector] = useState<SectorId>(defaultSector);
  const [category, setCategory] = useState(defaultCategory);
  const [price, setPrice] = useState("");
  const [valuationPreMoney, setValuationPreMoney] = useState<string>("");
  const [equityOfferedPct, setEquityOfferedPct] = useState(10);
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState<Stage>("seed");
  const [format, setFormat] = useState<Format>("hybrid");
  const [listingType, setListingType] = useState<ListingType>("investment");
  const [locationAddress, setLocationAddress] = useState("");
  const [analysisId, setAnalysisId] = useState<string | null>(null);
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

  const [uploading, setUploading] = useState(false);
  const [analysisInfo, setAnalysisInfo] = useState<null | {
    id: string;
    createdAt: string;
    result?: { riskAvg?: number; valuationLow?: number; valuationHigh?: number; successProbability?: number };
  }>(null);

  const draftKey = `draft:edit-startup:${id}`;

  const allAttachments = useMemo(() => mergeSlotAttachments(materialSlots), [materialSlots]);

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
        const r = await fetch(`/api/v1/startups/${id}`, { cache: "no-store", credentials: "include" });
        if (!r.ok) {
          const j = await r.json().catch(() => null);
          setErr(j?.error ?? "Не удалось загрузить");
          return;
        }
        const data = (await r.json()) as StartupDetail;
        if (cancelled) return;
        setItem(data);
        setTitle(data.title ?? "");
        const pe = data.profileExtra ?? null;
        setTagline(typeof pe?.tagline === "string" ? pe.tagline : "");
        const ind = normalizeIndustryPair(data.sector, data.category);
        setSector(ind.sector);
        setCategory(ind.subcategoryId);
        setPrice(String(data.price ?? ""));
        setDescription(data.description ?? "");
        setStage(asStage(data.stage, "seed"));
        setFormat(asFormat(data.format, "hybrid"));
        setListingType(asListingType((data as any).listingType, "investment"));
        setAnalysisId((data.analysisId as any) ?? null);
        setValuationPreMoney(pe?.valuationPreMoney != null ? String(pe.valuationPreMoney) : "");
        if (typeof pe?.equityOfferedPct === "number") setEquityOfferedPct(pe.equityOfferedPct);
        setLocationAddress(typeof pe?.locationAddress === "string" ? pe.locationAddress : "");
        if (Array.isArray(pe?.kpis)) {
          const next = pe.kpis.map((r) => ({ value: String(r?.value ?? ""), label: String(r?.label ?? "") }));
          setKpiRows(next.length ? next : [{ value: "", label: "" }]);
        }
        setMilestones(typeof pe?.milestones === "string" ? pe.milestones : "");
        if (Array.isArray(pe?.team)) {
          const t = pe.team
            .map((x) => ({ name: String(x?.name ?? ""), role: String(x?.role ?? "") }))
            .filter((x) => x.name || x.role);
          setTeamMembers(t.length ? t : [{ name: "", role: "" }]);
        }
        setVideoPitchUrl(typeof pe?.videoPitchUrl === "string" ? pe.videoPitchUrl : "");

        // Material slots
        const att = (data.attachments ?? []) as UploadedAttachment[];
        const byId = new Map(att.map((a) => [a.id, a]));
        const slotIds = pe?.materialSlotIds ?? {};
        const pitch = slotIds.pitchDeckId ? [byId.get(slotIds.pitchDeckId)].filter(Boolean) : [];
        const excel = slotIds.financialModelId ? [byId.get(slotIds.financialModelId)].filter(Boolean) : [];
        const video = slotIds.videoFileId ? [byId.get(slotIds.videoFileId)].filter(Boolean) : [];
        const otherIds = Array.isArray(slotIds.otherIds) ? slotIds.otherIds : [];
        const otherFromIds = otherIds.map((x) => byId.get(x)).filter(Boolean) as UploadedAttachment[];
        const used = new Set<string>([
          ...(pitch as any[]).map((a) => a.id),
          ...(excel as any[]).map((a) => a.id),
          ...(video as any[]).map((a) => a.id),
          ...otherFromIds.map((a) => a.id),
        ]);
        const leftover = att.filter((a) => !used.has(a.id));
        setMaterialSlots({
          pitch: pitch as UploadedAttachment[],
          excel: excel as UploadedAttachment[],
          video: video as UploadedAttachment[],
          other: [...otherFromIds, ...leftover],
        });

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
    // Restore draft after returning from analyzer.
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const d = JSON.parse(raw) as any;
      if (d?.title != null) setTitle(String(d.title));
      if (d?.tagline != null) setTagline(String(d.tagline));
      if (d?.description != null) setDescription(String(d.description));
      if (d?.sector && d?.category) {
        const n = normalizeIndustryPair(String(d.sector), String(d.category));
        setSector(n.sector);
        setCategory(n.subcategoryId);
      } else if (d?.category != null) {
        const n = normalizeIndustryPair(undefined, String(d.category));
        setSector(n.sector);
        setCategory(n.subcategoryId);
      }
      if (d?.price != null) setPrice(String(d.price));
      if (d?.valuationPreMoney != null) setValuationPreMoney(String(d.valuationPreMoney));
      if (typeof d?.equityOfferedPct === "number") setEquityOfferedPct(d.equityOfferedPct);
      if (d?.stage) setStage(d.stage);
      if (d?.format) setFormat(d.format);
      if (d?.listingType) setListingType(d.listingType);
      if (d?.locationAddress != null) setLocationAddress(String(d.locationAddress));
      if (Array.isArray(d?.kpiRows)) setKpiRows(d.kpiRows);
      if (d?.milestones != null) setMilestones(String(d.milestones));
      if (Array.isArray(d?.teamMembers)) setTeamMembers(d.teamMembers);
      if (d?.videoPitchUrl != null) setVideoPitchUrl(String(d.videoPitchUrl));
      if (d?.materialSlots && typeof d.materialSlots === "object") setMaterialSlots(d.materialSlots);
      localStorage.removeItem(draftKey);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (analysisIdFromUrl) setAnalysisId(analysisIdFromUrl);
  }, [analysisIdFromUrl]);

  useEffect(() => {
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

  function saveDraftForAnalyzer() {
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          title,
          tagline,
          description,
          sector,
          category,
          price,
          valuationPreMoney,
          equityOfferedPct,
          stage,
          format,
          listingType,
          locationAddress,
          kpiRows,
          milestones,
          teamMembers,
          videoPitchUrl,
          materialSlots,
        }),
      );
    } catch {
      // ignore
    }
    router.push(`/startup-analyzer?mode=startup&returnTo=/startups/${id}/edit`);
  }

  async function onSlotFiles(slot: MaterialSlot, files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setErr(null);
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
    } catch (e: any) {
      setErr(e?.message ?? "Не удалось загрузить файлы");
    } finally {
      setUploading(false);
    }
  }

  function removeFromSlot(slot: MaterialSlot, attId: string) {
    setMaterialSlots((prev) => ({ ...prev, [slot]: prev[slot].filter((a) => a.id !== attId) }));
  }

  function removeAttachmentEverywhere(attId: string) {
    setMaterialSlots((prev) => ({
      pitch: prev.pitch.filter((a) => a.id !== attId),
      excel: prev.excel.filter((a) => a.id !== attId),
      video: prev.video.filter((a) => a.id !== attId),
      other: prev.other.filter((a) => a.id !== attId),
    }));
  }

  function buildProfileExtra() {
    const kpis = kpiRows
      .map((r) => ({ value: r.value.trim(), label: r.label.trim() }))
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
    if (listingType === "investment") {
      if (valuationNum !== undefined && Number.isFinite(valuationNum) && valuationNum >= 0) out.valuationPreMoney = valuationNum;
      if (Number.isFinite(equityOfferedPct)) out.equityOfferedPct = equityOfferedPct;
    }
    if (format !== "online" && locationAddress.trim()) out.locationAddress = locationAddress.trim();
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

  const canEdit = me && item && (me.role === "admin" || me.id === item.owner.id);

  const fieldClass =
    "focus-ring w-full rounded-2xl border border-white/10 bg-[#1A1A24] px-7 py-5 text-base text-white outline-none placeholder:text-gray-500 focus:border-violet-500 [color-scheme:dark]";

  return (
    <div className="mx-auto max-w-5xl px-6 pb-20 pt-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link href={`/startups/${id}`} className="text-sm text-gray-400 transition hover:text-white">
          ← К проекту
        </Link>
      </div>

      <h1 className="text-center text-4xl font-bold tracking-tighter text-white md:text-5xl">Редактировать проект</h1>
      <p className="mb-10 mt-2 text-center text-lg text-gray-400">Изменения вступят в силу после сохранения</p>

      {loading ? (
        <div className="text-center text-[rgba(234,240,255,0.72)]">Загрузка…</div>
      ) : err && !item ? (
        <div className="text-center text-sm text-red-300">{err}</div>
      ) : !item ? (
        <div className="text-center text-[rgba(234,240,255,0.72)]">Не найдено.</div>
      ) : !canEdit ? (
        <div className="text-center text-[rgba(234,240,255,0.72)]">Нет прав на редактирование.</div>
      ) : (
        <form
          className="space-y-16 rounded-3xl border border-white/10 bg-[#12121A] p-8 md:p-10"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            setErr(null);
            try {
              const priceNum = price === "" ? undefined : Number(stripNonDigits(price));
              if (priceNum === undefined || !Number.isFinite(priceNum) || priceNum <= 0) {
                setErr(listingType === "sale" ? "Укажите цену продажи (положительное число)" : "Укажите сумму привлечения (положительное число)");
                return;
              }

              const profileExtra = buildProfileExtra();
              const r = await fetch(`/api/v1/startups/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  title,
                  description,
                  sector,
                  category,
                  price: priceNum,
                  stage,
                  format,
                  listingType,
                  analysisId,
                  profileExtra,
                  attachmentIds: allAttachments.map((a) => a.id),
                }),
              });
              const j = await r.json().catch(() => null);
              if (!r.ok) {
                setErr(j?.error ?? "Не удалось сохранить");
                return;
              }

              router.push(returnTo || `/startups/${id}`);
            } catch {
              setErr("Сетевая ошибка");
            } finally {
              setSaving(false);
            }
          }}
        >
          <div>
            <h2 className="mb-8 flex items-center gap-3 text-2xl font-semibold text-white">
              <span className="text-violet-400">1</span> Основная информация
            </h2>
            <div className="space-y-8">
              <div>
                <label className="mb-2 block text-sm text-gray-400">Название проекта</label>
                <input
                  className={fieldClass}
                  placeholder="Например: SalesAI Pro"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">Короткое описание</label>
                <input
                  className={fieldClass}
                  placeholder="ИИ-платформа для автоматизации продаж"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                />
              </div>
              <IndustryPickers
                sector={sector}
                subcategoryId={category}
                onChange={({ sector: s, subcategoryId }) => {
                  setSector(s);
                  setCategory(subcategoryId);
                }}
              />
              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  {listingType === "sale" ? "Цена продажи (₽)" : "Сумма привлечения (₽)"}
                </label>
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
                <label className="mb-2 block text-sm text-gray-400">Полное описание</label>
                <textarea
                  className={`${fieldClass} min-h-[140px] rounded-3xl`}
                  placeholder="Что делаете, для кого, чем сильнее конкурентов, текущий статус…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                />
              </div>
              <div className="grid gap-8 md:grid-cols-2">
                <label>
                  <div className="mb-2 block text-sm text-gray-400">Стадия</div>
                  <select className={fieldClass} value={stage} onChange={(e) => setStage(e.target.value as any)}>
                    {stages.map((s) => (
                      <option key={s} value={s}>
                        {stageLabelsByLang[lang]?.[s] ?? s}
                      </option>
                    ))}
                  </select>
                </label>
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
                <label>
                  <div className="mb-2 block text-sm text-gray-400">Тип карточки</div>
                  <select className={fieldClass} value={listingType} onChange={(e) => setListingType(e.target.value as any)}>
                    <option value="investment">Требуются инвестиции</option>
                    <option value="sale">Продажа проекта</option>
                  </select>
                </label>
              </div>
              {format !== "online" ? (
                <div>
                  <label className="mb-2 block text-sm text-gray-400">Адрес локации</label>
                  <input
                    className={fieldClass}
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    placeholder="Например: Москва, м. Белорусская / коворкинг / офис"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <h2 className="mb-8 flex items-center gap-3 text-2xl font-semibold text-white">
              <span className="text-rose-400">2</span> {listingType === "sale" ? "Условия продажи" : "Инвестиционные условия"}
            </h2>
            {listingType === "investment" ? (
              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <div className="mb-2 block text-sm text-gray-400">Оценка компании до сделки (без новых инвестиций), ₽</div>
                  <div className="flex">
                    <input
                      className={`${fieldClass} rounded-r-none border-r-0`}
                      value={formatDigitsWithSpaces(valuationPreMoney)}
                      onChange={(e) => setValuationPreMoney(stripNonDigits(e.target.value))}
                      inputMode="numeric"
                      placeholder="95 000 000"
                    />
                    <span className="flex items-center rounded-r-2xl border border-l-0 border-white/10 bg-[#1A1A24] px-5 text-gray-400">₽</span>
                  </div>
                </div>
                <div>
                  <div className="mb-2 block text-sm text-gray-400">Доля, которую готовы отдать</div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={equityOfferedPct}
                    onChange={(e) => setEquityOfferedPct(Number(e.target.value))}
                    className="w-full accent-rose-500"
                  />
                  <div className="mt-2 flex justify-between text-sm font-medium">
                    <span>0%</span>
                    <span className="text-rose-300">{equityOfferedPct}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-[rgba(234,240,255,0.72)]">
                Для «Продажи проекта» инвестиционные поля скрыты — здесь важна цена продажи и материалы.
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-6 flex items-center gap-3 text-2xl font-semibold text-white">
              <span className="text-emerald-400">3</span> KPI и вехи
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {kpiRows.map((row, i) => (
                <div key={i} className="rounded-3xl border border-white/10 bg-[#0A0A0F] p-6">
                  <div className="text-xs text-gray-500">KPI {i + 1}</div>
                  <input
                    className={`${fieldClass} mt-4`}
                    value={row.value}
                    onChange={(e) => setKpiRows((prev) => prev.map((x, idx) => (idx === i ? { ...x, value: e.target.value } : x)))}
                    placeholder="Например: 120k MAU"
                  />
                  <input
                    className={`${fieldClass} mt-3`}
                    value={row.label}
                    onChange={(e) => setKpiRows((prev) => prev.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))}
                    placeholder="Пояснение"
                  />
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              className="mt-4 rounded-2xl border border-white/30 px-6 py-3 hover:bg-white/10"
              onClick={() => setKpiRows((prev) => [...prev, { value: "", label: "" }])}
            >
              + Добавить показатель
            </Button>
            <div className="mt-8">
              <label className="mb-2 block text-sm text-gray-400">Что уже сделано</label>
              <textarea
                className={`${fieldClass} min-h-[140px] rounded-3xl`}
                value={milestones}
                onChange={(e) => setMilestones(e.target.value)}
                rows={6}
                placeholder="Через запятую: MVP, первые клиенты, пилот с …"
              />
            </div>
          </div>

          <div>
            <h2 className="mb-6 flex items-center gap-3 text-2xl font-semibold text-white">
              <span className="text-cyan-400">4</span> Команда и видео <span className="text-xs font-normal text-gray-500">(опционально)</span>
            </h2>
            <div className="space-y-6">
              <label>
                <div className="mb-2 block text-sm text-gray-400">Ссылка на видео-питч</div>
                <input className={fieldClass} value={videoPitchUrl} onChange={(e) => setVideoPitchUrl(e.target.value)} placeholder="YouTube / Drive / Loom…" />
              </label>
              <div>
                <div className="mb-3 text-sm text-gray-400">Команда</div>
                <div className="space-y-3">
                  {teamMembers.map((m, idx) => (
                    <div key={idx} className="grid gap-3 md:grid-cols-2">
                      <input
                        className={fieldClass}
                        value={m.name}
                        onChange={(e) => setTeamMembers((prev) => prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))}
                        placeholder="Имя"
                      />
                      <div className="flex gap-3">
                        <input
                          className={fieldClass}
                          value={m.role}
                          onChange={(e) => setTeamMembers((prev) => prev.map((x, i) => (i === idx ? { ...x, role: e.target.value } : x)))}
                          placeholder="Роль"
                        />
                        {idx > 0 ? (
                          <Button type="button" variant="ghost" className="h-[58px] px-4" onClick={() => setTeamMembers((prev) => prev.filter((_, i) => i !== idx))}>
                            ✕
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="secondary" className="mt-5 h-11 w-full rounded-2xl" onClick={() => setTeamMembers((prev) => [...prev, { name: "", role: "" }])}>
                  Добавить участника
                </Button>
              </div>
            </div>
          </div>

          {item?.auction ? (
            <div className="rounded-3xl border border-white/10 bg-[#0A0A0F] p-4 text-sm text-gray-400">
              По проекту есть аукцион (ставка {formatDigitsWithSpaces(String(item.auction.currentPrice))} ₽). Управление аукционом — в соответствующем разделе сайта.
            </div>
          ) : null}

          <div>
            <h2 className="mb-6 flex items-center gap-3 text-2xl font-semibold text-white">
              <span className="text-amber-400">5</span> Материалы проекта{" "}
              <span className="text-xs font-normal text-gray-500">(опционально)</span>
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <label className="upload-box cursor-pointer rounded-3xl border-2 border-dashed border-white/30 p-10 text-center">
                <input type="file" multiple className="sr-only" onChange={(e) => void onSlotFiles("other", e.target.files)} />
                <div className="text-4xl">📎</div>
                <p className="mt-4 font-medium text-white">Файлы</p>
                <p className="mt-1 text-xs text-gray-500">PDF, таблицы, архивы — нажмите или перетащите</p>
              </label>

              <div className="grid gap-4">
                <label className="upload-box cursor-pointer rounded-3xl border-2 border-dashed border-white/20 p-6 text-center">
                  <input type="file" className="sr-only" onChange={(e) => void onSlotFiles("pitch", e.target.files)} />
                  <div className="text-2xl">📄</div>
                  <div className="mt-2 text-sm font-medium text-white">Pitch deck (1 файл)</div>
                  {materialSlots.pitch[0] ? (
                    <div className="mt-2 flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#0A0A0F] px-3 py-2 text-left text-xs text-white/90">
                      <span className="truncate">{materialSlots.pitch[0].filename}</span>
                      <Button type="button" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => removeFromSlot("pitch", materialSlots.pitch[0]!.id)}>
                        Убрать
                      </Button>
                    </div>
                  ) : null}
                </label>
                <label className="upload-box cursor-pointer rounded-3xl border-2 border-dashed border-white/20 p-6 text-center">
                  <input type="file" className="sr-only" onChange={(e) => void onSlotFiles("excel", e.target.files)} />
                  <div className="text-2xl">📊</div>
                  <div className="mt-2 text-sm font-medium text-white">Финмодель (1 файл)</div>
                  {materialSlots.excel[0] ? (
                    <div className="mt-2 flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#0A0A0F] px-3 py-2 text-left text-xs text-white/90">
                      <span className="truncate">{materialSlots.excel[0].filename}</span>
                      <Button type="button" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => removeFromSlot("excel", materialSlots.excel[0]!.id)}>
                        Убрать
                      </Button>
                    </div>
                  ) : null}
                </label>
                <label className="upload-box cursor-pointer rounded-3xl border-2 border-dashed border-white/20 p-6 text-center">
                  <input type="file" className="sr-only" onChange={(e) => void onSlotFiles("video", e.target.files)} />
                  <div className="text-2xl">🎬</div>
                  <div className="mt-2 text-sm font-medium text-white">Видео-файл (1 файл)</div>
                  {materialSlots.video[0] ? (
                    <div className="mt-2 flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#0A0A0F] px-3 py-2 text-left text-xs text-white/90">
                      <span className="truncate">{materialSlots.video[0].filename}</span>
                      <Button type="button" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => removeFromSlot("video", materialSlots.video[0]!.id)}>
                        Убрать
                      </Button>
                    </div>
                  ) : null}
                </label>
              </div>

              <div
                className={`upload-box rounded-3xl border-2 border-dashed p-8 text-center ${
                  analysisId ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/30"
                }`}
              >
                {analysisId ? (
                  <div className="text-left">
                    <div className="text-sm font-semibold text-emerald-400">Отчёт анализатора прикреплён</div>
                    <div className="mt-2 text-xs text-gray-400">
                      {analysisInfo?.createdAt
                        ? new Date(analysisInfo.createdAt).toLocaleString("ru-RU")
                        : "Загрузка метаданных…"}
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
                          router.replace(`/startups/${id}/edit`);
                          setAnalysisId(null);
                          setAnalysisInfo(null);
                        }}
                      >
                        Убрать отчёт
                      </Button>
                    </div>
                    <div className="mt-2 text-[10px] text-gray-500">Сохраните форму, чтобы зафиксировать отчёт в карточке.</div>
                  </div>
                ) : (
                  <>
                    <div className="text-4xl">📊</div>
                    <p className="mt-4 font-medium text-white">Отчёт анализатора</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Черновик сохранится локально — после анализа вы вернётесь сюда с готовым отчётом
                    </p>
                    <Button type="button" className="mt-6 w-full rounded-2xl py-4 font-medium" variant="secondary" onClick={saveDraftForAnalyzer}>
                      Создать и прикрепить отчёт
                    </Button>
                  </>
                )}
              </div>
            </div>

            {uploading ? <div className="mt-4 text-sm text-gray-400">Загрузка файлов…</div> : null}
            {allAttachments.length ? (
              <div className="mt-6 space-y-2">
                {allAttachments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#1A1A24] px-4 py-3"
                  >
                    <a href={a.url} target="_blank" rel="noreferrer" className="truncate text-sm text-white/90">
                      {a.filename}
                    </a>
                    <Button type="button" variant="ghost" className="h-8 shrink-0 px-3 text-xs" onClick={() => removeAttachmentEverywhere(a.id)}>
                      Убрать
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {err ? <div className="text-sm text-red-300">{err}</div> : null}

          <div className="border-t border-white/10 pt-10">
            <Button
              type="submit"
              disabled={saving}
              className="w-full rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 py-7 text-xl font-semibold text-white hover:brightness-110 disabled:opacity-60"
            >
              {saving ? "…" : "Сохранить изменения"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

