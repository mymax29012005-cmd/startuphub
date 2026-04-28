import type { AutoSwot, StartupAnalysisInput, StartupAnalysisResult, SwotItem } from "../types";

function pickTop(items: SwotItem[], n: number) {
  return items.slice(0, n);
}

export function computeAutoSwot(input: StartupAnalysisInput, r: StartupAnalysisResult): AutoSwot {
  const strengths: SwotItem[] = [];
  const weaknesses: SwotItem[] = [];
  const opportunities: SwotItem[] = [];
  const threats: SwotItem[] = [];

  const d30 = input.retentionD30 || 0;
  const runway = r.runwayMonths || 0;
  const ltvCac = r.ltvToCac || 0;
  const gm = (r.grossMargin || 0) * 100;
  const tamGrowth = Number(input.tamGrowthPct) || 0;
  const comp = (input.competitionDensity || 0) * 100;

  const revQ = r.revenueQualityScore ?? null;
  const concRisk = r.concentrationRiskScore ?? null;
  const moatE = r.moatEvidenceScore ?? null;
  const evidence = r.stageEvidenceScore ?? null;
  const funnel = (r as any).funnelQualityScore as number | undefined;
  const conf = r.dataConfidenceScore ?? r.confidenceScore ?? 0;

  if (gm >= 65) strengths.push({ quadrant: "strengths", title: "Сильная валовая маржа", evidence: [`GM ≈ ${Math.round(gm)}%`] });
  if (runway >= 12) strengths.push({ quadrant: "strengths", title: "Комфортный запас денег", evidence: [`runway ≈ ${runway.toFixed(1)} мес`] });
  if (d30 >= 0.22) strengths.push({ quadrant: "strengths", title: "Сильное удержание (PMF‑сигнал)", evidence: [`D30 ≈ ${Math.round(d30 * 100)}%`] });
  if (ltvCac >= 2.5) strengths.push({ quadrant: "strengths", title: "Экономика масштаба выглядит устойчивой", evidence: [`LTV/CAC ≈ ${ltvCac.toFixed(2)}`] });
  if (revQ !== null && revQ >= 65) strengths.push({ quadrant: "strengths", title: "Качественный профиль выручки", evidence: [`revenue quality ≈ ${Math.round(revQ)}/100`] });
  if (moatE !== null && moatE >= 60) strengths.push({ quadrant: "strengths", title: "Защитимость подтверждается признаками", evidence: [`moat evidence ≈ ${Math.round(moatE)}/100`] });
  if (evidence !== null && evidence >= 60) strengths.push({ quadrant: "strengths", title: "Сильная доказательная база на стадии", evidence: [`evidence ≈ ${Math.round(evidence)}/100`] });
  if (typeof funnel === "number" && funnel >= 65) strengths.push({ quadrant: "strengths", title: "Здоровая воронка (активация/TTV)", evidence: [`funnel ≈ ${Math.round(funnel)}/100`] });

  if (runway > 0 && runway < 6) weaknesses.push({ quadrant: "weaknesses", title: "Короткий запас денег", evidence: [`runway ≈ ${runway.toFixed(1)} мес`] });
  if (d30 > 0 && d30 < 0.15) weaknesses.push({ quadrant: "weaknesses", title: "Низкое удержание снижает устойчивость", evidence: [`D30 ≈ ${Math.round(d30 * 100)}%`] });
  if (ltvCac > 0 && ltvCac < 2) weaknesses.push({ quadrant: "weaknesses", title: "Юнит‑экономика пока не даёт комфортного масштаба", evidence: [`LTV/CAC ≈ ${ltvCac.toFixed(2)}`] });
  if (revQ !== null && revQ < 45) weaknesses.push({ quadrant: "weaknesses", title: "Низкая устойчивость профиля выручки", evidence: [`revenue quality ≈ ${Math.round(revQ)}/100`] });
  if (concRisk !== null && concRisk >= 70) weaknesses.push({ quadrant: "weaknesses", title: "Высокая концентрация выручки", evidence: [`concentration risk ≈ ${Math.round(concRisk)}/100`] });
  if (moatE !== null && moatE < 40 && (input.moatStrength || 0) >= 60) weaknesses.push({ quadrant: "weaknesses", title: "Разрыв между заявленным moat и evidence", evidence: ["риск self‑report"] });
  if (typeof funnel === "number" && funnel > 0 && funnel < 45) weaknesses.push({ quadrant: "weaknesses", title: "Слабая воронка (активация/TTV)", evidence: [`funnel ≈ ${Math.round(funnel)}/100`] });
  if (conf < 50) weaknesses.push({ quadrant: "weaknesses", title: "Ограниченная точность оценки", evidence: [`data confidence ≈ ${Math.round(conf)}/100`] });

  if (tamGrowth >= 12) opportunities.push({ quadrant: "opportunities", title: "Рынок растёт — есть «ветер в спину»", evidence: [`рост TAM ≈ ${Math.round(tamGrowth)}%/год`] });
  if (d30 > 0 && d30 < 0.22) opportunities.push({ quadrant: "opportunities", title: "Апсайд через улучшение удержания/активации", evidence: ["retention‑upside"] });
  if (ltvCac > 0 && ltvCac < 2.8) opportunities.push({ quadrant: "opportunities", title: "Апсайд через снижение CAC и рост LTV", evidence: ["unit‑economics upside"] });
  if (revQ !== null && revQ < 70) opportunities.push({ quadrant: "opportunities", title: "Усиление качества выручки (повторяемость/диверсификация)", evidence: ["revenue durability"] });
  if (typeof funnel === "number" && funnel > 0 && funnel < 70) opportunities.push({ quadrant: "opportunities", title: "Апсайд через улучшение активации и time‑to‑value", evidence: ["funnel-upside"] });

  if (comp >= 70) threats.push({ quadrant: "threats", title: "Высокая конкурентная плотность", evidence: [`competition density ≈ ${Math.round(comp)}%`] });
  if (input.regulatory === "high") threats.push({ quadrant: "threats", title: "Регуляторные риски/неопределённость", evidence: ["regulatory=high"] });
  if (input.tech === "high") threats.push({ quadrant: "threats", title: "Технические риски/сложность исполнения", evidence: ["tech=high"] });
  if (concRisk !== null && concRisk >= 60) threats.push({ quadrant: "threats", title: "Риск потери ключевого аккаунта", evidence: ["concentration"] });

  return {
    strengths: pickTop(strengths, 4),
    weaknesses: pickTop(weaknesses, 4),
    opportunities: pickTop(opportunities, 4),
    threats: pickTop(threats, 4),
  };
}

