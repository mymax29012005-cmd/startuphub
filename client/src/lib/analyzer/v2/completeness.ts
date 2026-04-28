import type { StartupAnalysisInput } from "../types";

function isFilledNumber(v: unknown) {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}

function isFilledBoolean(v: unknown) {
  return typeof v === "boolean";
}

function filled(input: StartupAnalysisInput, k: keyof StartupAnalysisInput) {
  const v = (input as any)[k] as unknown;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return isFilledNumber(v);
  if (typeof v === "boolean") return isFilledBoolean(v);
  return v != null;
}

export function computeCompleteness(input: StartupAnalysisInput, keys: Array<keyof StartupAnalysisInput>) {
  const total = keys.length || 1;
  const filledCount = keys.filter((k) => filled(input, k)).length;
  return { filledCount, total, pct: Math.round((filledCount / total) * 100) };
}

