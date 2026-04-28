import type { ScenarioSummary, StartupAnalysisInput, StartupAnalysisResult } from "../types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function computeScenarioSummary(input: StartupAnalysisInput, r: StartupAnalysisResult): ScenarioSummary[] {
  const sp = Math.round((r.successProbability || 0) * 100);
  const conf = Math.round(r.dataConfidenceScore ?? r.confidenceScore ?? 50);
  const width = clamp(22 + Math.round((100 - conf) * 0.35), 18, 42);

  const baseLow = clamp(sp - Math.round(width / 2), 0, 100);
  const baseHigh = clamp(sp + Math.round(width / 2), 0, 100);

  // Upside/stress are not “new calculations”, just deterministic framing around key drivers.
  const upsideLow = clamp(baseLow + 8, 0, 100);
  const upsideHigh = clamp(baseHigh + 16, 0, 100);
  const stressLow = clamp(baseLow - 16, 0, 100);
  const stressHigh = clamp(baseHigh - 8, 0, 100);

  const assumptionsCommon = [
    "Диапазоны отражают неопределённость и качество данных, а не точное предсказание.",
    "Сценарии завязаны на улучшение/ухудшение ключевых драйверов (удержание, экономика, runway, качество выручки).",
  ];

  const stage = input.stage;
  const stageNote = stage === "idea" || input.mode === "idea" ? "На ранней стадии разброс шире: меньше объективных метрик." : "На более зрелых стадиях важнее качество выручки и удержание.";

  return [
    {
      case: "base",
      title: "Base case",
      assumptions: [...assumptionsCommon, stageNote],
      successProbabilityRange: { low: baseLow, high: baseHigh },
      notes: ["Текущие вводные без «оптимизма» и без стресс‑шоков."],
    },
    {
      case: "upside",
      title: "Upside case",
      assumptions: [...assumptionsCommon, "Удержание/экономика/качество выручки улучшаются без роста риска кассы."],
      successProbabilityRange: { low: upsideLow, high: upsideHigh },
      notes: ["Срабатывает план улучшений и ключевые метрики сдвигаются в «приемлемо/уверенно»."],
    },
    {
      case: "stress",
      title: "Stress case",
      assumptions: [...assumptionsCommon, "Рост замедляется или ухудшается retention/runway."],
      successProbabilityRange: { low: stressLow, high: stressHigh },
      notes: ["Доминирующий риск реализуется, и диапазон сдвигается вниз."],
    },
  ];
}

