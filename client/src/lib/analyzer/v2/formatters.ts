function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function roundPct(n: number) {
  return Math.round(clamp(n, 0, 100));
}

export function formatCompactMoneyRu(amountRub: number): string {
  const n = Number(amountRub) || 0;
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";

  if (abs < 1_000) return `${sign}${Math.round(abs)} ₽`;
  if (abs < 1_000_000) return `${sign}${Math.round(abs / 1_000)} тыс ₽`;
  if (abs < 1_000_000_000) {
    const v = abs / 1_000_000;
    return `${sign}${v >= 10 ? v.toFixed(0) : v.toFixed(1)} млн ₽`;
  }
  const b = abs / 1_000_000_000;
  return `${sign}${b >= 10 ? b.toFixed(0) : b.toFixed(1)} млрд ₽`;
}

export function formatValuationRangeHuman(low: number, base: number, high: number): { low: string; base: string; high: string } {
  return {
    low: formatCompactMoneyRu(low),
    base: formatCompactMoneyRu(base),
    high: formatCompactMoneyRu(high),
  };
}

export function makeSuccessRange(sp01: number, confidenceScore: number, stage: string): { low: number; high: number } {
  const base = clamp(sp01, 0, 1) * 100;
  const c = clamp(confidenceScore, 0, 100);
  const label = c >= 72 ? "high" : c >= 45 ? "medium" : "low";
  let halfWidth = label === "high" ? 7 : label === "medium" ? 12 : 18;
  if (stage === "idea") halfWidth += 4;
  const low = roundPct(base - halfWidth);
  const high = roundPct(base + halfWidth);
  return { low: clamp(low, 0, 100), high: clamp(high, 0, 100) };
}

