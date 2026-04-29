import type { StartupAnalysisInput, StartupAnalysisResult } from "../types";

type Rule = {
  id: string;
  when: (input: StartupAnalysisInput, result: StartupAnalysisResult) => boolean;
  warning: string;
  penaltyPoints: number; // 0..30 (aggregated later)
};

function pctTo01(pct: number) {
  return (Number(pct) || 0) / 100;
}

export function runConsistencyRules(input: StartupAnalysisInput, result: StartupAnalysisResult) {
  const rules: Rule[] = [
    {
      id: "high_nrr_low_grr",
      when: (i) => (i.nrrPct ?? 0) >= 120 && (i.grrPct ?? 0) > 0 && (i.grrPct ?? 0) < 80,
      warning: "NRR очень высокий при низком GRR: возможны ошибки в определениях (net vs gross) или единоразовые апсейлы при сильном оттоке.",
      penaltyPoints: 8,
    },
    {
      id: "revenue_shares_over_100",
      when: (i) => (i.oneOffRevenueSharePct ?? 0) + (i.pilotRevenueSharePct ?? 0) > 100,
      warning: "Доли выручки (one‑off + пилотная) суммарно > 100%. Проверьте вводные проценты.",
      penaltyPoints: 14,
    },
    {
      id: "top3_less_than_top1",
      when: (i) => (i.top3CustomersSharePct ?? 0) > 0 && (i.topCustomerSharePct ?? 0) > 0 && (i.top3CustomersSharePct ?? 0) < (i.topCustomerSharePct ?? 0),
      warning: "Доля топ‑3 клиентов не может быть меньше доли топ‑клиента. Проверьте вводные.",
      penaltyPoints: 16,
    },
    {
      id: "moat_gap_high_self_low_evidence",
      when: (i, r) => i.moatStrength >= 75 && (r as any).moatEvidenceScore !== undefined && Number((r as any).moatEvidenceScore) <= 35,
      warning: "Заявленный moat высокий, но подтверждающих признаков почти нет. Это снижает доверие к заявленным сигналам.",
      penaltyPoints: 10,
    },
    {
      id: "funnel_strong_but_low_retention",
      when: (i) => (i.signupToActivationPct ?? 0) >= 55 && (i.firstKeyActionCompletionPct ?? 0) >= 50 && i.retentionD30 > 0 && i.retentionD30 < 0.12,
      warning: "Воронка выглядит сильной (активация/ключевое действие), но D30 удержание низкое. Часто это означает, что ценность после активации не закрепляется.",
      penaltyPoints: 8,
    },
    {
      id: "moat_competition_retention",
      when: (i) => i.moatStrength >= 80 && i.competitionDensity >= 0.7 && i.retentionD30 > 0 && i.retentionD30 < 0.12,
      warning: "Высокий «moat» при высокой плотности конкуренции и низком удержании выглядит противоречиво. Проверьте, что именно защищает вас от конкурентов (технология, данные, канал, сетевой эффект).",
      penaltyPoints: 10,
    },
    {
      id: "team_strong_not_fulltime",
      when: (i) => i.teamStrength >= 75 && i.foundersFullTime === false,
      warning: "Сильная команда при отсутствии фаундеров в полном фокусе — риск исполнения. На ранних стадиях это снижает доверие к плану.",
      penaltyPoints: 8,
    },
    {
      id: "high_validation_zero_traction",
      when: (i) => i.marketValidation >= 75 && (i.activeUsers === 0 || i.monthlyRevenue === 0) && (i.customerInterviewsCount ?? 0) === 0 && (i.waitlistSize ?? 0) === 0,
      warning: "Высокая «валидация рынка» без объективных доказательств (пользователи/выручка/интервью/лист ожидания) выглядит завышенно. Добавьте измеримые подтверждения.",
      penaltyPoints: 12,
    },
    {
      id: "pmf_story_low_activation_repeat",
      when: (i, r) => r.pmfScore >= 65 && (i.activationRate > 0 && i.activationRate < 0.08) && (i.repeatPurchaseRate > 0 && i.repeatPurchaseRate < 0.1),
      warning: "Высокий PMF-скоринг при низкой активации и низкой повторной покупке — сигнал несостыковки в продуктовой воронке/вводных.",
      penaltyPoints: 10,
    },
    {
      id: "high_score_short_runway",
      when: (_i, r) => r.successProbability >= 0.55 && r.runwayMonths > 0 && r.runwayMonths < 4,
      warning: "Высокая оценка при запасе денег меньше 4 месяцев: даже хороший бизнес может не успеть «дожить» до улучшений. Это снижает надёжность позитивного сценария.",
      penaltyPoints: 14,
    },
    {
      id: "high_recurring_bad_churn",
      when: (i, r) => i.recurringShare >= 0.7 && (r.churn > 0.16 || i.monthlyChurnPct >= 16),
      warning: "Высокая доля повторяемой выручки при высоком churn выглядит сомнительно. Проверьте корректность churn (monthly) и базу, по которой он считается.",
      penaltyPoints: 10,
    },
    {
      id: "very_high_arpu_weak_market",
      when: (i) => i.arpu >= 150_000 && i.marketValidation <= 35 && i.tractionScore <= 35,
      warning: "Очень высокий ARPU при слабой валидации рынка и слабой тяге — частый признак неверного ARPU/ICP или единичных «неповторяемых» продаж.",
      penaltyPoints: 8,
    },
    {
      id: "idea_stage_hard_valuation_signals",
      when: (i, r) => (i.stage === "idea" || i.mode === "idea") && (r.dcf > 0 || r.valuationBase > 0) && i.monthlyRevenue === 0 && i.activeUsers === 0,
      warning: "Стадия «идея» без выручки/пользователей: valuation/DCF носят ориентировочный характер и не должны восприниматься как точная оценка.",
      penaltyPoints: 6,
    },
    {
      id: "dau_mau_impossible",
      when: (i) => i.dau > 0 && i.mau > 0 && i.dau > i.mau,
      warning: "DAU не может быть больше MAU. Проверьте вводные метрики.",
      penaltyPoints: 18,
    },
    {
      id: "retention_d1_d7_d30_order",
      when: (i) => {
        const d1 = i.retentionD1 || 0;
        const d7 = i.retentionD7 || 0;
        const d30 = i.retentionD30 || 0;
        if (d1 === 0 || d7 === 0 || d30 === 0) return false;
        return !(d1 >= d7 && d7 >= d30);
      },
      warning: "Обычно удержание убывает: D1 ≥ D7 ≥ D30. Ваши значения нарушают этот паттерн — возможно, разные базы/определения метрик.",
      penaltyPoints: 10,
    },
    {
      id: "revenue_concentration_risk",
      when: (i) => (i.topCustomerSharePct ?? 0) >= 50 || (i.revenueConcentrationPct ?? 0) >= 60,
      warning: "Высокая концентрация выручки на одном клиенте или группе клиентов повышает риск: потеря одного контрагента может обнулить рост и ухудшить запас денег.",
      penaltyPoints: 10,
    },
    {
      id: "nrr_missing_for_late_stage",
      when: (i) => (i.stage === "growth" || i.stage === "exit" || i.stage === "series_b") && (i.nrrPct ?? 0) === 0 && i.monthlyRevenue > 0,
      warning: "Для поздних стадий NRR (Net Revenue Retention) существенно влияет на оценку качества роста. Без NRR точность оценки ограничена.",
      penaltyPoints: 6,
    },
    {
      id: "payback_vs_ltv",
      when: (i, r) => i.unitPaybackMonths > 0 && r.paybackMonths > 0 && r.ltvToCac > 0 && r.ltvToCac < 1.2 && r.paybackMonths < 6,
      warning: "Низкий LTV/CAC при очень коротком payback — возможна ошибка в CAC/марже/ARPU или смешение метрик (lead vs customer).",
      penaltyPoints: 9,
    },
  ];

  const warnings: string[] = [];
  const penalties: string[] = [];
  let contradictionsFound = 0;
  let penaltyPoints = 0;

  for (const rule of rules) {
    if (!rule.when(input, result)) continue;
    warnings.push(rule.warning);
    penalties.push(`${rule.id}: −${rule.penaltyPoints}`);
    contradictionsFound += 1;
    penaltyPoints += rule.penaltyPoints;
  }

  // Небольшой дополнительный штраф за завышенные субъективные оценки без доказательной базы.
  const evidence = (input.customerInterviewsCount ?? 0) + (input.pilotCount ?? 0) + (input.loiCount ?? 0) + (input.waitlistSize ?? 0);
  if (input.marketValidation >= 85 && evidence < 3 && input.monthlyRevenue === 0) {
    warnings.push("Очень высокая оценка валидации рынка при слабой доказательной базе. Это снижает доверие к субъективным сигналам.");
    penalties.push("evidence_gap: −6");
    contradictionsFound += 1;
    penaltyPoints += 6;
  }

  const normalizedPenalty = Math.min(30, penaltyPoints); // cap to keep result stable
  return {
    warnings,
    penalties,
    contradictionsFound,
    penaltyPoints: normalizedPenalty,
  };
}

