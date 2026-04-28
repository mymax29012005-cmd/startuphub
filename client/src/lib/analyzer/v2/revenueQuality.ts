import type { StartupAnalysisInput } from "../types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export type RevenueQuality = {
  revenueQualityScore: number; // 0..100
  concentrationRiskScore: number; // 0..100 (higher = worse)
  customerConcentrationRisk: number; // 0..100 (higher = worse)
  notes: string[];
};

export function computeRevenueQuality(input: StartupAnalysisInput): RevenueQuality | null {
  const notes: string[] = [];

  const recurring = clamp(Number(input.recurringShare) || 0, 0, 1);
  const top1 = clamp(Number(input.topCustomerSharePct ?? input.revenueConcentrationPct ?? 0) || 0, 0, 100);
  const top3 = clamp(Number(input.top3CustomersSharePct ?? 0) || 0, 0, 100);
  const oneOff = clamp(Number(input.oneOffRevenueSharePct ?? 0) || 0, 0, 100);
  const pilot = clamp(Number(input.pilotRevenueSharePct ?? 0) || 0, 0, 100);
  const nrr = Number(input.nrrPct ?? 0) || 0;
  const grr = Number(input.grrPct ?? 0) || 0;

  const hasAny =
    recurring > 0 ||
    top1 > 0 ||
    top3 > 0 ||
    oneOff > 0 ||
    pilot > 0 ||
    nrr > 0 ||
    grr > 0;
  if (!hasAny) return null;

  const recurringScore = clamp(recurring * 100, 0, 100);

  // Concentration (penalize high dependency)
  const concTop1Penalty = clamp((top1 - 25) * 1.6, 0, 55); // >25% starts to bite
  const concTop3Penalty = clamp((top3 - 55) * 0.9, 0, 35); // >55% starts to bite
  const concentrationRiskScore = clamp(20 + concTop1Penalty + concTop3Penalty, 0, 100);
  const customerConcentrationRisk = concentrationRiskScore;

  // Retention of revenue (if present)
  const nrrScore = nrr > 0 ? clamp((nrr - 70) * 1.4, 0, 100) : null; // 70->0, 140->98
  const grrScore = grr > 0 ? clamp((grr - 60) * 2.0, 0, 100) : null; // 60->0, 110->100

  // One-off/pilot share: reduces durability for later stages
  const nonRecurringPenalty = clamp((oneOff + pilot - 20) * 0.8, 0, 30);

  let base = 0.55 * recurringScore + 0.25 * clamp(nrrScore ?? 60, 0, 100) + 0.2 * clamp(grrScore ?? 60, 0, 100);
  base = base - 0.35 * concentrationRiskScore - nonRecurringPenalty;
  const revenueQualityScore = clamp(base, 0, 100);

  if (recurring >= 0.6) notes.push("Высокая доля повторной выручки повышает предсказуемость.");
  else if (recurring > 0.3) notes.push("Повторяемость выручки средняя — важно укреплять удержание и апсейл.");
  else notes.push("Низкая повторяемость выручки — устойчивость профиля выручки под вопросом.");

  if (top1 >= 40) notes.push("Высокая зависимость от топ‑клиента: риск концентрации.");
  if (top3 >= 70) notes.push("Выручка сильно сосредоточена в нескольких аккаунтах.");
  if (nrr > 0) notes.push(`NRR: ${Math.round(nrr)}% (если применимо к модели).`);
  if (grr > 0) notes.push(`GRR: ${Math.round(grr)}% (если применимо к модели).`);
  if (oneOff + pilot >= 35) notes.push("Существенная доля разовых/пилотных денег — выше риск «непродлеваемости».");

  return { revenueQualityScore, concentrationRiskScore, customerConcentrationRisk, notes };
}

