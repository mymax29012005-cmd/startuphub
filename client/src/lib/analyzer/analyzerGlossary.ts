export type GlossaryKey =
  // Base / stage
  | "mode"
  | "stage"
  // Market / moat
  | "marketValidation"
  | "competition"
  | "competitionDensity"
  | "moatStrength"
  // Traction / team
  | "tractionScore"
  | "teamStrength"
  // Unit / product
  | "grossMarginPct"
  | "recurringShare"
  | "monthlyChurnPct"
  | "activeUsers"
  | "arpu"
  | "monthlyRevenue"
  | "newRevenueMonthly"
  | "salesMarketingSpend"
  | "cac"
  | "paybackMonths"
  | "dau"
  | "mau"
  | "retentionD1"
  | "retentionD7"
  | "retentionD30"
  | "activationRate"
  | "conversionRate"
  | "organicGrowthPct"
  | "viralCoefficient"
  | "repeatPurchaseRate"
  // Finance / ops / risks
  | "burnMonthly"
  | "cashOnHand"
  | "runwayMonths"
  | "releasesPerMonth"
  | "teamSize"
  | "foundersFullTime"
  | "tam"
  | "tamGrowthPct"
  | "regulatoryRisk"
  | "techRisk"
  // Results / v2 layers
  | "businessScore"
  | "dataConfidenceScore"
  | "dataCompletenessPct"
  | "consistencyScore"
  | "stageFitScore"
  | "successProbabilityRange"
  | "ltv"
  | "ltvToCac"
  | "burnMultiple"
  | "magicNumber"
  | "dcf"
  | "valuationRange"
  | "arr"
  | "expectedValue"
  | "riskAvg"
  | "pmfScore"
  | "growthScore"
  | "unitEconomicsScore"
  | "efficiencyScore"
  | "marketScore"
  | "investorScore"
  | "confidenceScore"
  | "stickiness"
  | "breakEvenMonthlyRevenue"
  // Report blocks
  | "riskHeatmap"
  | "efficiencyCurve"
  | "benchmarkBands"
  | "valuationRangeHuman"
  // Evidence (v2)
  | "customerInterviewsCount"
  | "pilotCount"
  | "loiCount"
  | "waitlistSize"
  // Mature (v2)
  | "nrrPct"
  | "topCustomerSharePct"
  | "revenueConcentrationPct";

type GlossaryItem = {
  title: string;
  short: string;
  /** Необязательно: как интерпретировать «хорошо/плохо» */
  interpretation?: string;
};

export const analyzerGlossary: Record<GlossaryKey, GlossaryItem> = {
  mode: {
    title: "Режим",
    short: "Startup — оцениваем работающий продукт и метрики. Idea — оцениваем гипотезу и готовность к следующей вехе.",
  },
  stage: {
    title: "Стадия",
    short: "Нужна, чтобы сравнивать метрики с корректными ожиданиями для этапа (идея/seed/Series A/B/growth/exit).",
  },

  marketValidation: {
    title: "Market validation",
    short: "Оценка подтверждённости боли и спроса (интервью, пилоты, выручка, повторяемость). Чем выше — тем меньше риск «строить не то».",
  },
  competition: {
    title: "Competition level",
    short: "Уровень конкуренции в сегменте (low/medium/high). Влияет на требования к дифференциации и удержанию.",
  },
  competitionDensity: {
    title: "Плотность конкуренции",
    short: "Насколько «тесный» рынок по вашему ощущению/оценке (0–100%). Высокая плотность обычно требует сильного удержания и moat.",
  },
  moatStrength: {
    title: "Moat strength",
    short: "Сила конкурентной защиты: насколько сложно повторить продукт или вытеснить вас (технология/данные/дистрибуция/сетевой эффект).",
  },
  tractionScore: {
    title: "Traction score",
    short: "Субъективная оценка тяги (интерес/рост/сигналы спроса). В v2 влияет осторожно и может снижать доверие при противоречиях с метриками.",
  },
  teamStrength: {
    title: "Team strength",
    short: "Субъективная оценка силы команды (опыт, скорость, компетенции). Важно для execution‑риска.",
  },

  grossMarginPct: {
    title: "Gross margin",
    short: "Валовая маржа: какая часть выручки остаётся после прямых затрат на оказание услуги/себестоимость.",
  },
  recurringShare: {
    title: "Recurring share",
    short: "Доля повторяемой выручки (подписка/повторы). Чем выше — тем лучше предсказуемость и качество модели.",
  },
  monthlyChurnPct: {
    title: "Monthly churn",
    short: "Отток за месяц: какой процент клиентов/пользователей перестаёт быть активным/платить.",
  },
  activeUsers: {
    title: "Active users",
    short: "Активные пользователи за месяц (если выручка неизвестна, используется вместе с ARPU для оценки выручки).",
  },
  arpu: {
    title: "ARPU",
    short: "Средняя выручка на одного активного пользователя за месяц (₽).",
  },
  monthlyRevenue: {
    title: "Monthly revenue",
    short: "Текущая месячная выручка (₽). Если неизвестна — можно оставить 0, но точность поздних стадий снизится.",
  },
  newRevenueMonthly: {
    title: "New revenue monthly",
    short: "Новая выручка за месяц (₽). Используется для burn multiple и оценки эффективности роста.",
  },
  salesMarketingSpend: {
    title: "Sales/marketing spend",
    short: "Расходы на продажи и маркетинг за месяц (₽). Нужны для magic number и проверки эффективности привлечения.",
  },
  cac: {
    title: "CAC",
    short: "Стоимость привлечения одного платящего клиента (₽).",
  },
  paybackMonths: {
    title: "Payback months",
    short: "За сколько месяцев окупаются затраты на привлечение клиента (CAC) валовой прибылью.",
  },
  dau: {
    title: "DAU",
    short: "Daily Active Users: активные пользователи в день.",
  },
  mau: {
    title: "MAU",
    short: "Monthly Active Users: активные пользователи в месяц.",
  },
  retentionD1: {
    title: "Retention D1",
    short: "Доля пользователей, которые возвращаются на следующий день после первого использования.",
  },
  retentionD7: {
    title: "Retention D7",
    short: "Доля пользователей, активных через 7 дней.",
  },
  retentionD30: {
    title: "Retention D30",
    short: "Доля пользователей, активных через 30 дней. Один из главных детерминированных сигналов PMF.",
  },
  activationRate: {
    title: "Activation rate",
    short: "Доля пользователей, которые доходят до «момента ценности» (ключевого действия) после входа в продукт.",
  },
  conversionRate: {
    title: "Conversion rate",
    short: "Доля пользователей, переходящих в оплату/целевой статус (в зависимости от вашей модели).",
  },
  organicGrowthPct: {
    title: "Organic growth",
    short: "Доля/темп органического роста (%). Сигнал качества продукта и дистрибуции.",
  },
  viralCoefficient: {
    title: "Viral coefficient",
    short: "Сколько новых пользователей приводит один активный пользователь (k‑factor).",
  },
  repeatPurchaseRate: {
    title: "Repeat purchase rate",
    short: "Доля пользователей, которые покупают повторно (если модель транзакционная).",
  },

  burnMonthly: {
    title: "Burn monthly",
    short: "Сколько денег компания тратит в месяц сверх поступлений (₽).",
  },
  cashOnHand: {
    title: "Cash on hand",
    short: "Сколько денег сейчас на счетах/в кассе (₽).",
  },
  runwayMonths: {
    title: "Runway",
    short: "На сколько месяцев хватит денег при текущем burn. Runway задаёт предел времени на исправление экономики.",
  },
  releasesPerMonth: {
    title: "Releases per month",
    short: "Скорость продуктовой разработки: сколько релизов в месяц (прокси execution‑скорости).",
  },
  teamSize: {
    title: "Team size",
    short: "Размер команды. Влияет на реалистичность темпа и burn.",
  },
  foundersFullTime: {
    title: "Founders full time",
    short: "Работают ли фаундеры над проектом full‑time. Для ранних стадий это сильный фактор доверия.",
  },
  tam: {
    title: "TAM",
    short: "Total Addressable Market: общий объём рынка, на который теоретически может претендовать продукт (₽).",
  },
  tamGrowthPct: {
    title: "TAM growth",
    short: "Оценка роста рынка в год (%). Высокий рост увеличивает «ветер в спину», но не заменяет PMF.",
  },
  regulatoryRisk: {
    title: "Regulatory risk",
    short: "Регуляторная неопределённость: насколько сильно правила/законы могут повлиять на бизнес.",
  },
  techRisk: {
    title: "Tech risk",
    short: "Технический риск: зависимость от сложных R&D, стабильности инфраструктуры, качества данных и т.п.",
  },

  businessScore: {
    title: "Business score",
    short: "Итоговая сила бизнеса/идеи (0–100) с учётом стадии. Это не «уверенность», а «качество» объекта оценки.",
  },
  dataConfidenceScore: {
    title: "Data confidence",
    short: "Насколько можно доверять оценке по полноте, согласованности и наличию объективных метрик (0–100).",
  },
  dataCompletenessPct: {
    title: "Completeness",
    short: "Процент заполненности значимых полей для стадии. Низкая полнота расширяет диапазоны и снижает уверенность.",
  },
  consistencyScore: {
    title: "Consistency",
    short: "Оценка отсутствия противоречий в вводных данных (0–100). При противоречиях снижается доверие к результату.",
  },
  stageFitScore: {
    title: "Stage fit",
    short: "Насколько текущие метрики и состояние соответствуют выбранной стадии (0–100).",
  },
  successProbabilityRange: {
    title: "Success probability range",
    short: "Диапазон вероятности успеха (в %), а не «ложно точное» число. Ширина зависит от уверенности в данных и стадии.",
  },
  ltv: {
    title: "LTV",
    short: "Lifetime Value: сколько выручки/валовой прибыли приносит клиент за жизнь (в модели зависит от churn).",
  },
  ltvToCac: {
    title: "LTV/CAC",
    short: "Отношение ценности клиента к стоимости привлечения. Для масштабирования обычно нужен запас (например ≥2–3 в зависимости от стадии).",
  },
  burnMultiple: {
    title: "Burn multiple",
    short: "Сколько burn тратится на 1 ₽ новой выручки. Чем ниже — тем эффективнее рост.",
  },
  dcf: {
    title: "DCF",
    short: "Discounted Cash Flow — ориентир по оценке через будущие денежные потоки. На ранних стадиях носит справочный характер.",
  },
  valuationRange: {
    title: "Valuation range",
    short: "Диапазон оценки (low/base/high) в человекочитаемом виде. Это ориентир, а не юридическая оценка стоимости.",
  },
  valuationRangeHuman: {
    title: "Диапазон оценки",
    short: "Человекочитаемый диапазон оценки (низ/база/верх). В v2 показывается без ложной точности и зависит от риска и полноты данных.",
  },
  arr: {
    title: "ARR",
    short: "Annual Recurring Revenue: годовая повторяемая выручка (≈ месячная выручка × 12).",
  },
  expectedValue: {
    title: "Expected value",
    short: "Ожидаемая ценность: ориентир, учитывающий вероятность успеха и базовый диапазон оценки. Это не гарантия результата.",
  },
  riskAvg: {
    title: "Risk profile",
    short: "Совокупный риск (0–100, где больше = хуже). Влияет на вероятность успеха и диапазоны вывода.",
  },
  pmfScore: {
    title: "PMF score",
    short: "Скоринг PMF (0–100): детерминированная оценка по удержанию, органике и повторным покупкам/повторяемости.",
  },
  growthScore: {
    title: "Growth score",
    short: "Скоринг роста (0–100): темп MoM и органический рост как сигналы спроса и дистрибуции.",
  },
  unitEconomicsScore: {
    title: "Unit economics score",
    short: "Скоринг юнит‑экономики (0–100): LTV/CAC, маржа и окупаемость привлечения.",
  },
  efficiencyScore: {
    title: "Efficiency score",
    short: "Скоринг эффективности (0–100): burn multiple и эффективность маркетинга (magic number).",
  },
  marketScore: {
    title: "Market score",
    short: "Скоринг рынка (0–100): размер TAM, рост рынка и конкурентное давление.",
  },
  investorScore: {
    title: "Investor score",
    short: "Инвест‑скоринг (0–100): агрегирует рост, юниты, PMF, эффективность и рынок в одну инвестиционную ось.",
  },
  confidenceScore: {
    title: "Confidence score",
    short: "Legacy‑уверенность (0–100): старый слой полноты данных. В v2 используется как fallback, если нет dataConfidenceScore.",
  },
  stickiness: {
    title: "Stickiness",
    short: "Stickiness = DAU/MAU. Приблизительно показывает, насколько часто люди возвращаются в продукт в течение месяца.",
  },
  breakEvenMonthlyRevenue: {
    title: "Break-even monthly revenue",
    short: "Точка безубыточности: какая месячная выручка нужна, чтобы валовая прибыль покрывала burn.",
  },
  riskHeatmap: {
    title: "Карта рисков",
    short: "Визуальная раскладка: какие оси сильнее всего давят на результат (отток, экономика привлечения, запас денег, рынок, технологии). Это не «точное измерение», а объяснимый индикатор приоритетов.",
  },
  efficiencyCurve: {
    title: "Кривая эффективности",
    short: "Сводная кривая по ключевым скорингам (рост → юнит‑экономика → PMF → эффективность). Нужна, чтобы видеть, где именно «ломается» инвестиционная логика.",
  },
  benchmarkBands: {
    title: "Бенчмарки",
    short: "Текстовые диапазоны (ниже нормы / приемлемо / уверенно и т.п.) с поправкой на стадию. Не абсолютная истина — это ориентир для объяснения, почему вывод именно такой.",
  },
  magicNumber: {
    title: "Magic number",
    short: "Прокси эффективности продаж/маркетинга: как хорошо расходы конвертируются в новую ARR/выручку.",
  },

  customerInterviewsCount: {
    title: "Customer interviews",
    short: "Количество интервью с потенциальными клиентами из вашего ICP. Усиливает доверие к «валидации рынка».",
  },
  pilotCount: {
    title: "Пилоты",
    short: "Количество пилотов/PoC с реальными клиентами. Это сильный детерминированный сигнал спроса.",
  },
  loiCount: {
    title: "LOI",
    short: "Письменные намерения/LOI — подтверждение потенциальной сделки или интереса.",
  },
  waitlistSize: {
    title: "Waitlist",
    short: "Размер списка ожидания. Важно оценивать не только размер, но и конверсию в активацию.",
  },

  nrrPct: {
    title: "NRR",
    short: "Net Revenue Retention (%): удержание и расширение выручки по существующим клиентам. >100% — сильный сигнал качества роста.",
  },
  topCustomerSharePct: {
    title: "Доля выручки топ‑клиента",
    short: "Сколько % выручки даёт один крупнейший клиент. Чем выше — тем выше риск концентрации.",
  },
  revenueConcentrationPct: {
    title: "Концентрация выручки",
    short: "Оценка концентрации выручки на нескольких крупнейших клиентах/контрагентах. Высокие значения увеличивают риск.",
  },
};

export function getAnalyzerHint(key: GlossaryKey, fallback?: string) {
  return analyzerGlossary[key]?.short ?? fallback ?? "";
}

