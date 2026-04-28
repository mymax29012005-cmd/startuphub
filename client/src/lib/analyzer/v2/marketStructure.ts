import type { StartupAnalysisInput } from "../types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export type MarketStructure = {
  buyerPowerScore: number;
  supplierPowerScore: number;
  threatOfNewEntrantsScore: number;
  substitutePressureScore: number;
  rivalryScore: number;
  marketStructurePressureScore: number; // 0..100 higher = worse
  notes: string[];
};

export function computeMarketStructure(input: StartupAnalysisInput): MarketStructure | null {
  const hasOverrides =
    [input.buyerPowerScore, input.supplierPowerScore, input.threatOfNewEntrantsScore, input.substitutePressureScore, input.rivalryScore].some(
      (x) => typeof x === "number" && Number.isFinite(x),
    );

  const comp = clamp((input.competitionDensity ?? 0) * 100, 0, 100);
  const tamGrowth = clamp(Number(input.tamGrowthPct) || 0, 0, 100);
  const regulatory = input.regulatory === "high" ? 80 : input.regulatory === "medium" ? 55 : 35;

  // Heuristic defaults (Porter-lite). Higher = worse pressure.
  const rivalry = hasOverrides ? clamp(Number(input.rivalryScore ?? comp), 0, 100) : clamp(comp, 0, 100);
  const threatNew = hasOverrides
    ? clamp(Number(input.threatOfNewEntrantsScore ?? (comp * 0.65 + (100 - regulatory) * 0.35)), 0, 100)
    : clamp(comp * 0.65 + (100 - regulatory) * 0.35, 0, 100);
  const substitutes = hasOverrides
    ? clamp(Number(input.substitutePressureScore ?? (comp * 0.55 + (100 - tamGrowth) * 0.25 + 20)), 0, 100)
    : clamp(comp * 0.55 + (100 - tamGrowth) * 0.25 + 20, 0, 100);
  const buyerPower = hasOverrides
    ? clamp(Number(input.buyerPowerScore ?? (55 + comp * 0.25)), 0, 100)
    : clamp(55 + comp * 0.25, 0, 100);
  const supplierPower = hasOverrides ? clamp(Number(input.supplierPowerScore ?? 45), 0, 100) : 45;

  const marketStructurePressureScore = clamp(
    0.28 * rivalry + 0.22 * threatNew + 0.2 * substitutes + 0.18 * buyerPower + 0.12 * supplierPower,
    0,
    100,
  );

  const notes: string[] = [];
  notes.push("Porter‑lite слой: это рамка давления структуры рынка, а не академический анализ.");
  if (rivalry >= 70) notes.push("Сильная конкурентная борьба: требуется дифференциация/удержание/канал.");
  if (buyerPower >= 70) notes.push("Сильная власть покупателя: давление на цену/маржу, важен ROI.");
  if (threatNew >= 70) notes.push("Низкие барьеры входа: требуется moat evidence и скорость исполнения.");
  if (substitutes >= 70) notes.push("Высокая угроза заменителей: важно показать закрепление ценности (retention).");
  if (regulatory >= 70) notes.push("Регуляторные факторы могут повысить барьеры, но и риск.");

  return {
    buyerPowerScore: buyerPower,
    supplierPowerScore: supplierPower,
    threatOfNewEntrantsScore: threatNew,
    substitutePressureScore: substitutes,
    rivalryScore: rivalry,
    marketStructurePressureScore,
    notes,
  };
}

