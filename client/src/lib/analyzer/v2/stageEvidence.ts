import type { StartupAnalysisInput } from "../types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export type StageEvidence = {
  stageEvidenceScore: number; // 0..100
  notes: string[];
};

export function computeStageEvidence(input: StartupAnalysisInput): StageEvidence | null {
  const stage = input.stage;
  const isEarly = stage === "idea" || stage === "seed" || input.mode === "idea";

  const interviews = Number(input.customerInterviewsCount ?? 0) || 0;
  const pilots = Number(input.pilotCount ?? 0) || 0;
  const paidPilots = Number(input.paidPilotCount ?? 0) || 0;
  const lois = Number(input.loiCount ?? 0) || 0;
  const waitlist = Number(input.waitlistSize ?? 0) || 0;
  const calls = Number(input.founderSalesCallsCount ?? 0) || 0;
  const partners = Number(input.designPartnerCount ?? 0) || 0;

  const hasAny = interviews + pilots + paidPilots + lois + waitlist + calls + partners > 0;
  if (!hasAny) return null;

  // Deterministic scoring (early stages weigh evidence more)
  const score =
    0.22 * clamp((interviews / (isEarly ? 25 : 40)) * 100, 0, 100) +
    0.22 * clamp((calls / (isEarly ? 40 : 60)) * 100, 0, 100) +
    0.18 * clamp((pilots / (isEarly ? 6 : 10)) * 100, 0, 100) +
    0.18 * clamp((paidPilots / (isEarly ? 3 : 6)) * 100, 0, 100) +
    0.12 * clamp((lois / (isEarly ? 6 : 12)) * 100, 0, 100) +
    0.08 * clamp((partners / (isEarly ? 4 : 8)) * 100, 0, 100);

  const stageEvidenceScore = clamp(score, 0, 100);

  const notes: string[] = [];
  if (interviews > 0) notes.push(`Интервью: ${interviews}`);
  if (calls > 0) notes.push(`Продажные/пресейл‑звонки: ${calls}`);
  if (pilots > 0) notes.push(`Пилоты: ${pilots}`);
  if (paidPilots > 0) notes.push(`Платные пилоты: ${paidPilots}`);
  if (lois > 0) notes.push(`LOI: ${lois}`);
  if (partners > 0) notes.push(`Design partners: ${partners}`);
  if (waitlist > 0) notes.push(`Лист ожидания: ${waitlist} (важна конверсия в активацию)`);

  return { stageEvidenceScore, notes };
}

