import type { StartupAnalysisInput } from "../types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export type FunnelQuality = {
  funnelQualityScore: number; // 0..100
  notes: string[];
};

export function computeFunnelQuality(input: StartupAnalysisInput): FunnelQuality | null {
  const v2s = Number(input.visitorToSignupConversionPct ?? 0) || 0;
  const s2a = Number(input.signupToActivationPct ?? 0) || 0;
  const a2p = Number(input.activationToPaidPct ?? 0) || 0;
  const ttv = Number(input.timeToValueDays ?? 0) || 0;
  const key = Number(input.firstKeyActionCompletionPct ?? 0) || 0;

  const hasAny = v2s > 0 || s2a > 0 || a2p > 0 || ttv > 0 || key > 0;
  if (!hasAny) return null;

  // Simple deterministic normalization:
  // - conversions are already %; time-to-value: 0..30 days mapped to 100..0
  const v2sScore = clamp((v2s / 20) * 100, 0, 100); // 20% is "strong"
  const s2aScore = clamp((s2a / 60) * 100, 0, 100); // 60% strong
  const a2pScore = clamp((a2p / 25) * 100, 0, 100); // 25% strong (depends on model, but safe)
  const keyScore = clamp((key / 60) * 100, 0, 100);
  const ttvScore = ttv > 0 ? clamp(100 - (ttv / 14) * 100, 0, 100) : 60; // 14d => 0, fast => high

  const funnelQualityScore = clamp(0.18 * v2sScore + 0.26 * s2aScore + 0.22 * a2pScore + 0.18 * keyScore + 0.16 * ttvScore, 0, 100);

  const notes: string[] = [];
  if (ttv > 0) notes.push(`Time‑to‑value: ${ttv} дн (быстрее = лучше).`);
  if (s2a > 0) notes.push(`Регистрация → активация: ${Math.round(s2a)}%.`);
  if (a2p > 0) notes.push(`Активация → оплата: ${Math.round(a2p)}%.`);
  if (v2s > 0) notes.push(`Визит → регистрация: ${Math.round(v2s)}%.`);
  if (key > 0) notes.push(`Ключевое действие: ${Math.round(key)}%.`);

  if (funnelQualityScore < 45) notes.push("Слабая воронка часто «маскируется» под проблему retention — сначала укрепите активацию и TTV.");
  else if (funnelQualityScore < 65) notes.push("Воронка средняя: апсайд обычно в активации и снижении time‑to‑value.");
  else notes.push("Воронка выглядит здоровой: если retention низкий — вероятно проблема в ценности после активации.");

  return { funnelQualityScore, notes };
}

