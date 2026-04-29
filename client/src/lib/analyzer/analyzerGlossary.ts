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
  | "paidPilotCount"
  | "loiCount"
  | "waitlistSize"
  | "founderSalesCallsCount"
  | "designPartnerCount"
  // Mature (v2)
  | "nrrPct"
  | "grrPct"
  | "topCustomerSharePct"
  | "top3CustomersSharePct"
  | "oneOffRevenueSharePct"
  | "pilotRevenueSharePct"
  | "revenueConcentrationPct"
  // Funnel quality (v2)
  | "visitorToSignupConversionPct"
  | "signupToActivationPct"
  | "activationToPaidPct"
  | "timeToValueDays"
  | "firstKeyActionCompletionPct"
  // Objective layers (v2)
  | "revenueQualityScore"
  | "concentrationRiskScore"
  | "moatEvidenceScore"
  | "moatGapFlag"
  | "marketStructurePressureScore"
  | "buyerPowerScore"
  | "supplierPowerScore"
  | "threatOfNewEntrantsScore"
  | "substitutePressureScore"
  | "rivalryScore"
  | "swot";

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
    title: "Валидация рынка",
    short: "Оценка подтверждённости боли и спроса (интервью, пилоты, выручка, повторяемость). Чем выше — тем меньше риск «строить не то».",
  },
  competition: {
    title: "Уровень конкуренции",
    short: "Уровень конкуренции в сегменте (low/medium/high). Влияет на требования к дифференциации и удержанию.",
  },
  competitionDensity: {
    title: "Плотность конкуренции",
    short: "Насколько «тесный» рынок по вашему ощущению/оценке (0–100%). Высокая плотность обычно требует сильного удержания и moat.",
  },
  moatStrength: {
    title: "Защитный ров (moat)",
    short: "Сила конкурентной защиты: насколько сложно повторить продукт или вытеснить вас (технология/данные/дистрибуция/сетевой эффект).",
  },
  tractionScore: {
    title: "Тракция (субъективно)",
    short: "Субъективная оценка тяги (интерес/рост/сигналы спроса). В v2 влияет осторожно и может снижать доверие при противоречиях с метриками.",
  },
  teamStrength: {
    title: "Сила команды (субъективно)",
    short: "Субъективная оценка силы команды (опыт, скорость, компетенции). Важно для execution‑риска.",
  },

  grossMarginPct: {
    title: "Валовая маржа",
    short: "Валовая маржа: какая часть выручки остаётся после прямых затрат на оказание услуги/себестоимость.",
  },
  recurringShare: {
    title: "Доля повторной выручки",
    short: "Доля повторяемой выручки (подписка/повторы). Чем выше — тем лучше предсказуемость и качество модели.",
  },
  monthlyChurnPct: {
    title: "Отток (churn) в месяц",
    short: "Отток за месяц: какой процент клиентов/пользователей перестаёт быть активным/платить.",
  },
  activeUsers: {
    title: "Активные пользователи",
    short: "Активные пользователи за месяц (если выручка неизвестна, используется вместе с ARPU для оценки выручки).",
  },
  arpu: {
    title: "ARPU",
    short: "Средняя выручка на одного активного пользователя за месяц (₽).",
  },
  monthlyRevenue: {
    title: "Выручка в месяц",
    short: "Текущая месячная выручка (₽). Если неизвестна — можно оставить 0, но точность поздних стадий снизится.",
  },
  newRevenueMonthly: {
    title: "Новая выручка за месяц",
    short: "Новая выручка за месяц (₽). Используется для burn‑мультипликатора и оценки эффективности роста.",
  },
  salesMarketingSpend: {
    title: "Расходы на продажи/маркетинг",
    short: "Расходы на продажи и маркетинг за месяц (₽). Нужны для magic number и проверки эффективности привлечения.",
  },
  cac: {
    title: "CAC",
    short: "Стоимость привлечения одного платящего клиента (₽).",
  },
  paybackMonths: {
    title: "Окупаемость (payback), мес",
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
    title: "Удержание D1",
    short: "Доля пользователей, которые возвращаются на следующий день после первого использования.",
  },
  retentionD7: {
    title: "Удержание D7",
    short: "Доля пользователей, активных через 7 дней.",
  },
  retentionD30: {
    title: "Удержание D30",
    short: "Доля пользователей, активных через 30 дней. Один из главных детерминированных сигналов PMF.",
  },
  activationRate: {
    title: "Активация",
    short: "Доля пользователей, которые доходят до «момента ценности» (ключевого действия) после входа в продукт.",
  },
  conversionRate: {
    title: "Конверсия",
    short: "Доля пользователей, переходящих в оплату/целевой статус (в зависимости от вашей модели).",
  },
  organicGrowthPct: {
    title: "Органический рост",
    short: "Доля/темп органического роста (%). Сигнал качества продукта и дистрибуции.",
  },
  viralCoefficient: {
    title: "Вирусный коэффициент",
    short: "Сколько новых пользователей приводит один активный пользователь (k‑factor).",
  },
  repeatPurchaseRate: {
    title: "Повторные покупки",
    short: "Доля пользователей, которые покупают повторно (если модель транзакционная).",
  },

  burnMonthly: {
    title: "Burn (сжигание), ₽/мес",
    short: "Сколько денег компания тратит в месяц сверх поступлений (₽).",
  },
  cashOnHand: {
    title: "Денег на счету",
    short: "Сколько денег сейчас на счетах/в кассе (₽).",
  },
  runwayMonths: {
    title: "Запас денег (runway)",
    short: "На сколько месяцев хватит денег при текущем burn. Запас денег задаёт предел времени на исправление экономики.",
  },
  releasesPerMonth: {
    title: "Релизы в месяц",
    short: "Скорость продуктовой разработки: сколько релизов в месяц (прокси execution‑скорости).",
  },
  teamSize: {
    title: "Размер команды",
    short: "Размер команды. Влияет на реалистичность темпа и burn.",
  },
  foundersFullTime: {
    title: "Фаундеры full‑time",
    short: "Работают ли фаундеры над проектом full‑time. Для ранних стадий это сильный фактор доверия.",
  },
  tam: {
    title: "TAM",
    short: "Total Addressable Market: общий объём рынка, на который теоретически может претендовать продукт (₽).",
  },
  tamGrowthPct: {
    title: "Рост TAM, %/год",
    short: "Оценка роста рынка в год (%). Высокий рост увеличивает «ветер в спину», но не заменяет PMF.",
  },
  regulatoryRisk: {
    title: "Регуляторный риск",
    short: "Регуляторная неопределённость: насколько сильно правила/законы могут повлиять на бизнес.",
  },
  techRisk: {
    title: "Технический риск",
    short: "Технический риск: зависимость от сложных R&D, стабильности инфраструктуры, качества данных и т.п.",
  },

  businessScore: {
    title: "Сила бизнеса",
    short: "Итоговая сила бизнеса/идеи (0–100) с учётом стадии. Это не «уверенность», а «качество» объекта оценки.",
  },
  dataConfidenceScore: {
    title: "Надёжность оценки",
    short: "Показывает, насколько можно доверять результату на основе полноты и согласованности входных данных.",
  },
  dataCompletenessPct: {
    title: "Полнота данных",
    short: "Процент заполненности значимых полей для стадии. Низкая полнота расширяет диапазоны и снижает уверенность.",
  },
  consistencyScore: {
    title: "Согласованность",
    short: "Оценка отсутствия противоречий в вводных данных (0–100). При противоречиях снижается доверие к результату.",
  },
  stageFitScore: {
    title: "Соответствие стадии",
    short: "Насколько текущие метрики и состояние соответствуют выбранной стадии (0–100).",
  },
  successProbabilityRange: {
    title: "Диапазон вероятности успеха",
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
    title: "Burn‑мультипликатор",
    short: "Сколько burn тратится на 1 ₽ новой выручки. Чем ниже — тем эффективнее рост.",
  },
  dcf: {
    title: "DCF",
    short: "Discounted Cash Flow — ориентир по оценке через будущие денежные потоки. На ранних стадиях носит справочный характер.",
  },
  valuationRange: {
    title: "Диапазон оценки",
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
    title: "Ожидаемая ценность",
    short: "Ожидаемая ценность: ориентир, учитывающий вероятность успеха и базовый диапазон оценки. Это не гарантия результата.",
  },
  riskAvg: {
    title: "Профиль риска",
    short: "Совокупный риск (0–100, где больше = хуже). Влияет на вероятность успеха и диапазоны вывода.",
  },
  pmfScore: {
    title: "PMF‑скоринг",
    short: "Скоринг PMF (0–100): детерминированная оценка по удержанию, органике и повторным покупкам/повторяемости.",
  },
  growthScore: {
    title: "Скоринг роста",
    short: "Скоринг роста (0–100): темп MoM и органический рост как сигналы спроса и дистрибуции.",
  },
  unitEconomicsScore: {
    title: "Скоринг юнит‑экономики",
    short: "Скоринг юнит‑экономики (0–100): LTV/CAC, маржа и окупаемость привлечения.",
  },
  efficiencyScore: {
    title: "Скоринг эффективности",
    short: "Скоринг эффективности (0–100): burn‑мультипликатор и эффективность маркетинга (magic number).",
  },
  marketScore: {
    title: "Скоринг рынка",
    short: "Скоринг рынка (0–100): размер TAM, рост рынка и конкурентное давление.",
  },
  investorScore: {
    title: "Инвест‑скоринг",
    short: "Инвест‑скоринг (0–100): агрегирует рост, юниты, PMF, эффективность и рынок в одну инвестиционную ось.",
  },
  confidenceScore: {
    title: "Уверенность (legacy)",
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
  paidPilotCount: {
    title: "Платные пилоты",
    short: "Количество платных пилотов/POC. Сильнее, чем интерес: это сигнал willingness‑to‑pay.",
  },
  loiCount: {
    title: "LOI",
    short: "Письменные намерения/LOI — подтверждение потенциальной сделки или интереса.",
  },
  waitlistSize: {
    title: "Waitlist",
    short: "Размер списка ожидания. Важно оценивать не только размер, но и конверсию в активацию.",
  },
  founderSalesCallsCount: {
    title: "Продажные звонки",
    short: "Сколько разговоров с потенциальными покупателями провели фаундеры. На ранней стадии — объективный evidence‑сигнал.",
  },
  designPartnerCount: {
    title: "Design partners",
    short: "Партнёры, с которыми вы делаете продукт. Сигнал глубины ICP и ценностного предложения.",
  },

  nrrPct: {
    title: "NRR",
    short: "Net Revenue Retention (%): удержание и расширение выручки по существующим клиентам. >100% — сильный сигнал качества роста.",
  },
  grrPct: {
    title: "GRR",
    short: "Gross Revenue Retention (%): удержание выручки без expansion. Помогает увидеть «протекающее ведро».",
  },
  topCustomerSharePct: {
    title: "Доля выручки топ‑клиента",
    short: "Сколько % выручки даёт один крупнейший клиент. Чем выше — тем выше риск концентрации.",
  },
  top3CustomersSharePct: {
    title: "Доля топ‑3 клиентов",
    short: "Суммарная доля выручки топ‑3 клиентов (%). Показывает зависимость от нескольких аккаунтов.",
  },
  oneOffRevenueSharePct: {
    title: "Доля разовой выручки",
    short: "Процент выручки, которая не повторяется (one‑off). Чем выше — тем ниже устойчивость.",
  },
  pilotRevenueSharePct: {
    title: "Доля пилотной выручки",
    short: "Процент выручки из пилотов/POC. Помогает не переоценить «пилотные деньги» как устойчивый ARR.",
  },
  revenueConcentrationPct: {
    title: "Концентрация выручки",
    short: "Оценка концентрации выручки на нескольких крупнейших клиентах/контрагентах. Высокие значения увеличивают риск.",
  },

  visitorToSignupConversionPct: {
    title: "Конверсия визит → регистрация",
    short: "Верх воронки. Низкая конверсия часто означает проблему позиционирования/оффера.",
  },
  signupToActivationPct: {
    title: "Конверсия регистрация → активация",
    short: "Переход к моменту ценности. Сильный предиктор retention.",
  },
  activationToPaidPct: {
    title: "Конверсия активация → оплата",
    short: "Насколько активация превращается в деньги. Влияет на payback и масштабируемость.",
  },
  timeToValueDays: {
    title: "Time‑to‑value (дней)",
    short: "Сколько дней до первого результата. Чем меньше — тем легче удержание и продажи.",
  },
  firstKeyActionCompletionPct: {
    title: "Доля ключевого действия",
    short: "Процент пользователей, которые делают ключевое действие. Часто объясняет будущий retention.",
  },

  revenueQualityScore: {
    title: "Качество выручки",
    short: "Показывает, насколько выручка выглядит устойчивой: повторяемость, концентрация и удержание выручки.",
  },
  concentrationRiskScore: {
    title: "Риск концентрации выручки",
    short: "Показывает, насколько бизнес зависит от одного или нескольких крупных клиентов.",
  },
  moatEvidenceScore: {
    title: "Подтверждённость moat",
    short: "Оценивает не саму идею защиты, а то, насколько она подтверждена фактами.",
  },
  moatGapFlag: {
    title: "Разрыв moat",
    short: "Флаг: заявленный moat высокий, но evidence низкий. Anti‑gaming сигнал.",
  },
  marketStructurePressureScore: {
    title: "Структура рынка",
    short: "Показывает, насколько сама структура рынка помогает или мешает росту.",
  },
  buyerPowerScore: {
    title: "Buyer power",
    short: "Сила покупателя (0–100): насколько легко клиенту давить на цену/условия. Выше = хуже для маржи.",
  },
  supplierPowerScore: {
    title: "Supplier power",
    short: "Сила поставщиков (0–100): зависимость от платформ/поставщиков/каналов. Выше = хуже.",
  },
  threatOfNewEntrantsScore: {
    title: "Threat of new entrants",
    short: "Угроза новых игроков (0–100): ниже барьеры — выше риск входа конкурентов. Выше = хуже.",
  },
  substitutePressureScore: {
    title: "Substitute pressure",
    short: "Давление заменителей (0–100): насколько легко заменить продукт альтернативой. Выше = хуже.",
  },
  rivalryScore: {
    title: "Rivalry",
    short: "Конкурентная борьба (0–100): насколько агрессивна конкуренция. Выше = хуже.",
  },
  swot: {
    title: "SWOT-снимок",
    short: "Короткая стратегическая сводка, собранная автоматически по данным анализа.",
  },
};

export function getAnalyzerHint(key: GlossaryKey, fallback?: string) {
  return analyzerGlossary[key]?.short ?? fallback ?? "";
}

