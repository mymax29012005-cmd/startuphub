import type { StartupAnalysisInput } from "../types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export type MoatEvidence = {
  moatEvidenceScore: number; // 0..100
  moatGapFlag: boolean;
  notes: string[];
};

export function computeMoatEvidence(input: StartupAnalysisInput): MoatEvidence | null {
  const flags = [
    input.moatEvidenceProprietaryData,
    input.moatEvidenceSwitchingCosts,
    input.moatEvidenceIntegrationDepth,
    input.moatEvidenceDistributionAdvantage,
    input.moatEvidenceRegulatoryBarrier,
    input.moatEvidenceNetworkEffects,
    input.moatEvidenceBrandCommunity,
    input.moatEvidenceOperationalSpeed,
  ];
  const present = flags.filter(Boolean).length;
  const anyAnswered = flags.some((x) => x === true) || flags.some((x) => x === false);
  if (!anyAnswered && (input.moatStrength ?? 0) <= 0) return null;

  // Score: evidence count + small adjustment for competition density (need more evidence on crowded markets)
  const comp = clamp((input.competitionDensity ?? 0) * 100, 0, 100);
  const base = clamp((present / 8) * 100, 0, 100);
  const adjusted = clamp(base - Math.max(0, comp - 55) * 0.25, 0, 100);

  const self = clamp(Number(input.moatStrength) || 0, 0, 100);
  const moatGapFlag = self >= 70 && adjusted <= 45;

  const notes: string[] = [];
  if (present >= 5) notes.push("Есть несколько независимых признаков защитимости (evidence).");
  else if (present >= 3) notes.push("Часть защитимости подтверждена, но доказательность средняя.");
  else notes.push("Подтверждений защитимости мало — moat выглядит скорее заявлением, чем доказательством.");

  if (moatGapFlag) notes.push("Заявленная сила moat заметно выше подтверждённости — риск self-report.");
  if (input.moatEvidenceProprietaryData) notes.push("Сигнал: преимущество в данных.");
  if (input.moatEvidenceSwitchingCosts) notes.push("Сигнал: switching costs/встроенность в процессы.");
  if (input.moatEvidenceIntegrationDepth) notes.push("Сигнал: глубина интеграций повышает удержание.");
  if (input.moatEvidenceDistributionAdvantage) notes.push("Сигнал: преимущество дистрибуции/канала.");
  if (input.moatEvidenceRegulatoryBarrier) notes.push("Сигнал: регуляторный барьер/лицензирование.");
  if (input.moatEvidenceNetworkEffects) notes.push("Сигнал: сетевой эффект.");
  if (input.moatEvidenceBrandCommunity) notes.push("Сигнал: бренд/комьюнити lock-in.");
  if (input.moatEvidenceOperationalSpeed) notes.push("Сигнал: операционная скорость как преимущество.");

  return { moatEvidenceScore: adjusted, moatGapFlag, notes };
}

