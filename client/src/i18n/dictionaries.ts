export type Lang = "ru" | "en" | "zh";

export const supportedLangs: Lang[] = ["ru", "en", "zh"];

const dictionaries: Record<Lang, any> = {
  ru: {
    nav: {
      home: "Главная",
      marketplace: "Маркетплейс",
      auctions: "Аукционы",
      auctionsSoon: "Скоро · soon",
      startups: "Стартапы",
      ideas: "Идеи",
      auction: "Аукцион",
      investors: "Инвесторы",
      partners: "Партнёры",
      favorites: "Избранное",
      analyzer: "Анализатор",
      chats: "Чаты",
      profile: "Профиль",
      login: "Войти",
      register: "Регистрация",
      admin: "Админ",
    },
    hero: {
      title: "Маркетплейс стартапов и идей",
      subtitle:
        "Публикуйте проекты, находите инвесторов и партнёров, участвуйте в аукционах — в одном месте.",
      ctaSell: "Продать стартап",
      ctaIdea: "Выложить идею",
      ctaExplore: "Смотреть платформу",
    },
    home: {
      statsStartups: "Стартапы",
      statsIdeas: "Идеи",
      statsAuctions: "Активные аукционы",

      howItWorksTitle: "Как это работает",
      howItWorksText:
        "Создайте профиль, разместите стартап или идею, затем получайте отклики от инвесторов и партнёров. Если на проект запущен аукцион — вы видите текущую цену и время окончания лота.",

      foundersTitle: "Для основателей",
      foundersText:
        "Продавайте доли/права на проект через аукционы или находите партнёров и капитал напрямую в лентах запросов.",

      investorsTitle: "Для инвесторов",
      investorsText:
        "Просматривайте предложения, сохраняйте избранное и отслеживайте активные лоты. Базовые отзывы и рейтинг помогают быстрее оценить доверие.",

      whyTitle: "Почему StartupHub",
      whyText:
        "StartupHub объединяет публикацию и поиск стартапов и идей проектов, запросы инвестиций и партнёрства, а также торговые механики через аукционы — в одном интерфейсе. Мы делаем процесс понятным: статусы, карточки, быстрые формы и прозрачные состояния загрузки.",

      favoritesBtn: "Избранное",
      auctionsBtn: "Смотреть аукционы",

      lastStartups: "Последние стартапы",
      lastIdeas: "Последние идеи",
      lastAuctions: "Активные аукционы",

      seeAll: "Смотреть все",
    },
    pages: {
      addStartup: "+ Добавить стартап",
      addIdea: "+ Добавить идею",
      addInvestor: "+ Разместить запрос",
      addPartner: "+ Разместить запрос",

      noActiveAuctions: "Активных аукционов пока нет.",
      loginToSaveFavoritesPrefix: "Чтобы сохранять избранное, пожалуйста, ",
      loginToSaveFavoritesLink: "войдите",
      loginToSaveFavoritesSuffix: " в аккаунт.",
      emptyFavorites: "Пока нет сохранённых объектов.",

      emptyInvestors: "Пока нет размещённых запросов.",
      emptyPartners: "Пока нет размещённых запросов.",

      settings: "Настройки",
      profileSettingsTitle: "Настройки профиля",
      status: "Статус",
      save: "Сохранить",
      logout: "Выйти из аккаунта",
      publicProfileLink: "Как видят другие",
      delete: "Удалить",
      deleteConfirm: "Удалить эту карточку? Отменить действие будет нельзя.",
    },
    userPublic: {
      loadError: "Не удалось загрузить профиль",
      notFound: "Пользователь не найден",
      activityTitle: "История действий",
      activityEmpty: "Нет записей",
      chatCta: "Перейти в чат с пользователем",
      chatSelf: "Это ваш профиль",
      chatStubTitle: "Чат",
      chatStubText: "Переписка с пользователями появится в следующих версиях.",
      chatStubBack: "К профилю",
      statsStartups: "Стартапы",
      statsIdeas: "Идеи",
      bioEmpty: "Описание не заполнено.",
      activity: {
        user_registered: "Регистрация на платформе",
        startup_created: "Размещён стартап",
        idea_created: "Размещена идея",
        bid_placed: "Ставка на аукционе",
        review_written: "Отзыв о",
        investor_request: "Запрос инвестора",
        partner_request: "Запрос партнёра",
        favorite_added: "В избранное",
      },
    },
    chatsPage: {
      title: "Чаты",
      emptyList: "Пока нет диалогов. Откройте чат из профиля пользователя.",
      loginRequired: "Войдите в аккаунт, чтобы видеть переписки.",
      loadError: "Не удалось загрузить чаты",
      threadLoadError: "Не удалось открыть чат",
      cannotSelf: "Нельзя открыть чат с самим собой.",
      messagePlaceholder: "Сообщение…",
      send: "Отправить",
      you: "Вы",
      lastMessageYou: "Вы: ",
      lead: "",
      load: "",
      status: "",
    },
    analyzer: {
      breadcrumb: "Анализатор",
      title: "Анализатор стартапа",
      backToStartups: "Назад к стартапам",

      modes: { startup: "Стартап", idea: "Идея" },
      stages: {
        idea: "Идея",
        seed: "Seed (ранняя стадия)",
        series_a: "Раунд A",
        series_b: "Раунд B",
        growth: "Рост",
        exit: "Выход (exit)",
      },

      steps: {
        market: "Рынок",
        traction: "Тяга",
        unit: "Юнит-экономика",
        finance: "Финансы и риски",
        report: "Отчет",
      },

      section: {
        market: "Рынок и позиционирование",
        traction: "Тяга и команда",
        unit: "Юнит-экономика",
        finance: "Финансы и риск-профиль",
      },

      help: {
        market: "Оцените подтверждение рынка и конкуренцию. Чем выше подтверждение — тем ниже риск.",
        traction: "Оцените собственную тягу и силу команды.",
        unit: "Заполните маржу, удержание (churn) и ключевые параметры экономики юнитов.",
        finance: "Укажите расходы, остаток денег и профиль рисков.",
      },

      fields: {
        marketValidation: "Подтверждение рынка",
        competition: "Интенсивность конкуренции",
        moatStrength: "Сила «моата»",
        tractionScore: "Индекс тяги",
        teamStrength: "Сила команды",
        grossMargin: "Валовая маржа",
        monthlyChurnPct: "Churn (потери) в месяц",
        growthMonthly: "Рост в месяц",
        monthlyRevenue: "Выручка в месяц (₽)",
        activeUsers: "Активные пользователи",
        arpu: "ARPU (₽)",
        cac: "CAC (₽)",
        paybackMonths: "Окупаемость, мес",
        recurringShare: "Доля повторяемой выручки",
        burnMonthly: "Расходы (burn) в месяц (₽)",
        cashOnHand: "Денежный запас (₽)",
        regulatory: "Регуляторные риски",
        tech: "Технологические риски",
      },

      fieldHelp: {
        marketValidation:
          "Как поставить цифру (0–100): 0–20 — только идея; 30–50 — интервью/опросы/лид-магнит; 60–80 — есть пилоты/первые продажи; 90–100 — стабильные повторные продажи/очередь.",
        competition:
          "Насколько сильны конкуренты и насколько легко на рынок «войти». Чем выше — тем больше риск.",
        moatStrength:
          "Как поставить цифру (0–100): 0–20 — легко скопировать; 30–50 — есть отличия, но повторят быстро; 60–80 — есть сильное преимущество (данные/сеть/контракты/тех); 90–100 — преимущество почти не повторить.",
        tractionScore:
          "Как поставить цифру (0–100): 0–20 — ещё нет пользователей; 30–50 — есть первые активные, но рост нестабилен; 60–80 — есть рост и удержание; 90–100 — быстрый рост + сильное удержание/повторные покупки.",
        teamStrength:
          "Как поставить цифру (0–100): 0–20 — нет ключевых компетенций; 30–50 — есть базовые роли; 60–80 — сильный опыт в домене/продукте; 90–100 — топ-экспертиза + быстрое исполнение.",
        grossMargin:
          "Валовая маржа показывает, сколько остаётся с каждой вырученной ₽ после прямых затрат. Чем выше — тем устойчивее бизнес.",
        monthlyChurnPct:
          "Churn — это доля клиентов, которые уходят каждый месяц. Ниже churn — выше LTV.",
        arpu:
          "ARPU — средняя выручка на одного активного пользователя за месяц.",
        cac:
          "CAC — стоимость привлечения одного клиента/пользователя (сколько ₽ вы тратите на привлечение).",
        paybackMonths:
          "Сколько месяцев нужно, чтобы окупить затраты на привлечение (CAC) за счёт маржинальной прибыли.",
        burnMonthly:
          "Burn — сколько ₽ вы тратите в месяц (зарплаты, маркетинг, инфраструктура).",
        cashOnHand:
          "Денежный запас — сколько ₽ у вас есть сейчас, чтобы пережить период до первых больших денег.",
        regulatory:
          "Риск проблем из-за законов/регуляторов (лицензии, требования, ограничения).",
        tech:
          "Технологический риск: насколько сложно поддерживать продукт, зависимость от технологий, надёжность.",
        growthMonthly:
          "Насколько быстро растёт ключевой показатель каждый месяц (пользователи/выручка).",
        recurringShare:
          "Доля выручки, которая повторяется (подписки/контракты/регулярные платежи).",
      },

      levels: {
        low: "Низкий",
        medium: "Средний",
        high: "Высокий",
      },

      tip: {
        market: "Как оценивать рынок",
        traction: "Как оценивать тягу",
        unit: "Как оценивать юнит-экономику",
        finance: "Как оценивать финансы",
      },
      tipText: {
        market: "Если есть продажи, пилоты и повторяемый спрос — подтверждение выше.",
        traction: "Оцените, насколько быстро продукт доказывает спрос (рост/удержание/вовлечение).",
        unit: "Маржа и churn напрямую влияют на LTV и устойчивость роста.",
        finance: "Runway (сколько месяцев проживете) — критичный фактор риска.",
      },

      actions: {
        back: "Назад",
        next: "Дальше",
        calculate: "Рассчитать",
        edit: "Редактировать",
        save: "Сохранить анализ",
        dontSave: "Не сохранять",
        backToAnalyzer: "К анализатору",
        createStartupWithAnalysis: "Создать стартап с этим анализом",
        createIdeaWithAnalysis: "Создать идею с этим анализом",
        saving: "Сохраняем…",
        loginToSave: "Войдите в аккаунт, чтобы сохранить анализ.",
      },

      risk: {
        low: "Низкий риск",
        medium: "Средний риск",
        high: "Высокий риск",
      },

      report: {
        radarTitle: "Сильные стороны (визуализация)",
        summaryTitle: "Ключевой вывод",
        probability: "Вероятность успеха",
        risk: "Уровень риска",
        runway: "Выживаемость (runway)",
        burn: "Burn",
        expectedValue: "Ожидаемая выгода (E[V])",
        expectedValueHint: "С учётом вероятности успеха и риска",
        unitEconomicsTitle: "Юнит-экономика",
        ltv: "LTV",
        payback: "Окупаемость",
        valuationTitle: "Оценка стоимости",
        valuationText1: "Диапазон рассчитан без ИИ по детерминированным правилам (мультипликаторы + DCF).",
        valuationLow: "Нижняя граница",
        valuationHigh: "Верхняя граница",
        financialTitle: "Финансовые показатели",
        arr: "ARR (оценка повторяемой выручки)",
        multiple: "Мультипликатор",
        breakeven: "Безубыточность (выручка/мес)",
        npv: "NPV (5 лет)",
        cashflowTitle: "Денежные потоки (5 лет)",
        riskBreakdownTitle: "Разбор риска",
        riskDrivers: {
          market: "Рынок",
          competition: "Конкуренция",
          execution: "Исполнение/команда",
          financial: "Финансовая устойчивость",
          regulatory: "Регуляторные риски",
          tech: "Технологические риски",
        },
        riskNote: "Чем выше значение, тем выше вероятность проблем.",
        empty: "Сначала заполните вопросы и нажмите «Рассчитать».",
        report: "Отчет",
        labels: {
          market: "Рынок",
          unit: "Unit",
          traction: "Тяга",
          team: "Команда",
          financial: "Финансы",
          risk: "Риски",
        },
      },

      historyTitle: "История анализов",
      historyLogin: "Войдите в аккаунт, чтобы видеть сохранённые отчёты.",
      historySubtitle: "Список сохранённых отчётов привязан к вашему аккаунту.",
      historyLoading: "Загрузка истории…",
      historyEmpty: "Пока нет сохранённых анализов.",
      historyOpen: "Открыть",
      historyDelete: "Удалить",
    },
    auth: {
      loginTitle: "Вход",
      registerTitle: "Регистрация",
      emailOrPhone: "Email или телефон",
      password: "Пароль",
      name: "Имя",
      accountType: "Тип аккаунта",
      submitLogin: "Войти",
      submitRegister: "Создать аккаунт",
      alreadyAuth: "Вы уже вошли в систему.",
    },
    common: {
      loading: "Загрузка…",
      dbUnavailable: "База данных недоступна. Попробуйте позже.",
      error: "Ошибка",
      success: "Готово",
    },
    footer: {
      description:
        "Платформа для публикации стартапов и идей, поиска инвесторов и партнёров, а также участия в аукционах.",
      contacts: "Контакты: genstartup@yandex.ru",
      navTitle: "Навигация",
      helpTitle: "Помощь",

      links: {
        home: "Главная",
        startups: "Стартапы",
        ideas: "Идеи",
        auction: "Аукцион",
        investors: "Инвесторы",
        partners: "Партнёры",
        favorites: "Избранное",
        analyzer: "Анализатор",
        chats: "Чаты",
        profile: "Профиль",
      },
      help: {
        rules: "Правила платформы",
        privacy: "Политика конфиденциальности",
        faq: "FAQ",
      },
    },
  },
  en: {
    nav: {
      home: "Home",
      marketplace: "Marketplace",
      auctions: "Auctions",
      auctionsSoon: "Soon",
      startups: "Startups",
      ideas: "Ideas",
      auction: "Auction",
      investors: "Investors",
      partners: "Partners",
      favorites: "Favorites",
      analyzer: "Analyzer",
      profile: "Profile",
      login: "Login",
      register: "Register",
      admin: "Admin",
    },
    hero: {
      title: "Marketplace for startups and ideas",
      subtitle:
        "Publish projects, find investors and partners, and bid in auctions — all in one place.",
      ctaSell: "Sell a startup",
      ctaIdea: "Post an idea",
      ctaExplore: "Explore platform",
    },
    home: {
      statsStartups: "Startups",
      statsIdeas: "Ideas",
      statsAuctions: "Active auctions",

      howItWorksTitle: "How it works",
      howItWorksText:
        "Create a profile, post a startup or an idea, then receive feedback from investors and partners. If an auction is running for a project — you can see the current price and the lot end time.",

      foundersTitle: "For founders",
      foundersText:
        "Sell stakes/rights via auctions or find partners and capital directly in request feeds.",

      investorsTitle: "For investors",
      investorsText:
        "Browse offers, save favorites, and track active lots. Reviews and ratings help you build trust faster.",

      whyTitle: "Why StartupHub",
      whyText:
        "StartupHub brings together publishing and searching for startups/ideas, investment and partnership requests, plus auction trading mechanics — all in one UI. We make the process clear with statuses, well-designed cards, quick forms, and transparent loading states.",

      favoritesBtn: "Favorites",
      auctionsBtn: "View auctions",

      lastStartups: "Latest startups",
      lastIdeas: "Latest ideas",
      lastAuctions: "Active auctions",

      seeAll: "See all",
    },
    pages: {
      addStartup: "+ Add startup",
      addIdea: "+ Post an idea",
      addInvestor: "+ Create request",
      addPartner: "+ Create request",

      noActiveAuctions: "No active auctions yet.",
      loginToSaveFavoritesPrefix: "To save favorites, please ",
      loginToSaveFavoritesLink: "sign in",
      loginToSaveFavoritesSuffix: ".",
      emptyFavorites: "No saved items yet.",

      emptyInvestors: "No investment requests yet.",
      emptyPartners: "No partner requests yet.",

      settings: "Settings",
      profileSettingsTitle: "Profile settings",
      status: "Status",
      save: "Save",
      logout: "Log out",
      publicProfileLink: "Public profile",
      delete: "Delete",
      deleteConfirm: "Delete this item? This cannot be undone.",
    },
    userPublic: {
      loadError: "Could not load profile",
      notFound: "User not found",
      activityTitle: "Activity",
      activityEmpty: "No entries",
      chatCta: "Open chat with this user",
      chatSelf: "This is you",
      chatStubTitle: "Chat",
      chatStubText: "Messaging will be available in a future update.",
      chatStubBack: "Back to profile",
      statsStartups: "Startups",
      statsIdeas: "Ideas",
      bioEmpty: "No bio yet.",
      activity: {
        user_registered: "Signed up",
        startup_created: "Posted startup",
        idea_created: "Posted idea",
        bid_placed: "Auction bid",
        review_written: "Review for",
        investor_request: "Investor request",
        partner_request: "Partner request",
        favorite_added: "Added to favorites",
      },
    },
    chatsPage: {
      title: "Chats",
      emptyList: "No conversations yet. Start one from a user profile.",
      loginRequired: "Sign in to see your chats.",
      loadError: "Could not load chats",
      threadLoadError: "Could not open chat",
      messagePlaceholder: "Message…",
      send: "Send",
      you: "You",
      lastMessageYou: "You: ",
      lead: "",
      load: "",
      status: "",
    },
    analyzer: {
      breadcrumb: "Analyzer",
      title: "Startup analyzer",
      backToStartups: "Back to startups",

      modes: { startup: "Startup", idea: "Idea" },
      stages: {
        idea: "Idea",
        seed: "Seed (early)",
        series_a: "Series A",
        series_b: "Series B",
        growth: "Growth",
        exit: "Exit",
      },
      steps: { market: "Market", traction: "Traction", unit: "Unit economics", finance: "Finance & risks", report: "Report" },
      section: {
        market: "Market & positioning",
        traction: "Traction & team",
        unit: "Unit economics",
        finance: "Finance & risk profile",
      },
      help: {
        market: "Estimate market validation and competition. Higher validation lowers risk.",
        traction: "Estimate your traction and team strength.",
        unit: "Fill gross margin, churn and key unit-economics parameters.",
        finance: "Provide burn, cash and risk profile.",
      },
      fields: {
        marketValidation: "Market validation",
        competition: "Competition intensity",
        moatStrength: "Moat strength",
        tractionScore: "Traction index",
        teamStrength: "Team strength",
        grossMargin: "Gross margin",
        monthlyChurnPct: "Monthly churn",
        growthMonthly: "Monthly growth",
        monthlyRevenue: "Monthly revenue (₽)",
        activeUsers: "Active users",
        arpu: "ARPU (₽)",
        cac: "CAC (₽)",
        paybackMonths: "Payback, months",
        recurringShare: "Recurring revenue share",
        burnMonthly: "Burn per month (₽)",
        cashOnHand: "Cash on hand (₽)",
        regulatory: "Regulatory risk",
        tech: "Tech risk",
      },

      fieldHelp: {
        marketValidation:
          "How well the market is validated by sales/pilots. Higher means less risk.",
        competition:
          "How strong competitors are and how easy it is to enter. Higher means more risk.",
        moatStrength:
          "A moat is a durable advantage (brand, network, unique tech, cost advantage) that is hard to copy.",
        tractionScore:
          "How quickly the product proves demand (growth/retention/engagement). Higher is better.",
        teamStrength:
          "How strong the team is: experience, learning speed, ability to execute the plan.",
        grossMargin:
          "Gross margin shows how much profit remains after direct costs. Higher is healthier.",
        monthlyChurnPct:
          "Churn is the share of customers leaving every month. Lower churn increases LTV.",
        arpu:
          "ARPU is average monthly revenue per active user.",
        cac:
          "CAC is the cost to acquire one customer/user (how much you spend).",
        paybackMonths:
          "How many months it takes to recoup CAC using contribution margin.",
        burnMonthly:
          "Burn per month: how much cash you spend (team, marketing, infrastructure).",
        cashOnHand:
          "Cash on hand: how much money you currently have to survive until the next milestones.",
        regulatory:
          "Regulatory risk: likelihood of legal/compliance issues affecting the business.",
        tech:
          "Tech risk: difficulty of maintaining the product and reliability of your tech stack.",
        growthMonthly:
          "How fast your key metric grows each month (users/revenue).",
        recurringShare:
          "Recurring share of revenue (subscriptions/contracts/regular payments).",
      },
      levels: { low: "Low", medium: "Medium", high: "High" },
      tip: { market: "Market scoring", traction: "Traction scoring", unit: "Unit-economics", finance: "Finance scoring" },
      tipText: {
        market: "If you have sales, pilots and repeatable demand, validation is higher.",
        traction: "Estimate how quickly the product proves demand (growth/retention/engagement).",
        unit: "Margin and churn drive LTV and sustainable growth.",
        finance: "Runway (months to survive) is a critical risk factor.",
      },
      actions: {
        back: "Back",
        next: "Next",
        calculate: "Calculate",
        edit: "Edit",
        save: "Save analysis",
        dontSave: "Don't save",
        backToAnalyzer: "Back to analyzer",
        createStartupWithAnalysis: "Create startup with this analysis",
        createIdeaWithAnalysis: "Create idea with this analysis",
        saving: "Saving…",
        loginToSave: "Sign in to save analysis.",
      },
      risk: { low: "Low risk", medium: "Medium risk", high: "High risk" },
      report: {
        radarTitle: "Strengths (visual)",
        summaryTitle: "Key takeaway",
        probability: "Success probability",
        risk: "Risk level",
        runway: "Runway",
        burn: "Burn",
        expectedValue: "Expected value (E[V])",
        expectedValueHint: "Adjusted by success probability",
        unitEconomicsTitle: "Unit economics",
        ltv: "LTV",
        payback: "Payback",
        valuationTitle: "Valuation range",
        valuationText1: "Range is computed deterministically (multiples + simplified DCF), no AI.",
        valuationLow: "Lower bound",
        valuationHigh: "Upper bound",
        financialTitle: "Financial metrics",
        arr: "ARR (recurring revenue estimate)",
        multiple: "Multiple",
        breakeven: "Breakeven (monthly revenue)",
        npv: "NPV (5 years)",
        cashflowTitle: "Cashflows (5 years)",
        riskBreakdownTitle: "Risk breakdown",
        riskDrivers: {
          market: "Market",
          competition: "Competition",
          execution: "Execution/Team",
          financial: "Financial stability",
          regulatory: "Regulatory risk",
          tech: "Tech risk",
        },
        riskNote: "Higher value means higher chance of issues.",
        empty: "Fill the questions and press «Calculate».",
        labels: { market: "Market", unit: "Unit", traction: "Traction", team: "Team", financial: "Finance", risk: "Risks" },
      },

      historyTitle: "Your analysis history",
      historyLogin: "Sign in to view your saved reports.",
      historySubtitle: "Saved reports are attached to your account.",
      historyLoading: "Loading history…",
      historyEmpty: "No saved analyses yet.",
      historyOpen: "Open",
      historyDelete: "Delete",
    },
    auth: {
      loginTitle: "Login",
      registerTitle: "Register",
      emailOrPhone: "Email or phone",
      password: "Password",
      name: "Name",
      accountType: "Account type",
      submitLogin: "Sign in",
      submitRegister: "Create account",
      alreadyAuth: "You are already signed in.",
    },
    common: {
      loading: "Loading…",
      dbUnavailable: "Database is unavailable. Try again later.",
      error: "Error",
      success: "Done",
    },
    footer: {
      description:
        "A platform to publish startups and ideas, find investors and partners, and participate in auctions.",
      contacts: "Contact: genstartup@yandex.ru",
      navTitle: "Navigation",
      helpTitle: "Help",

      links: {
        home: "Home",
        startups: "Startups",
        ideas: "Ideas",
        auction: "Auction",
        investors: "Investors",
        partners: "Partners",
        favorites: "Favorites",
        analyzer: "Analyzer",
        chats: "Chats",
        profile: "Profile",
      },
      help: {
        rules: "Platform rules",
        privacy: "Privacy policy",
        faq: "FAQ",
      },
    },
  },
  zh: {
    nav: {
      home: "首页",
      marketplace: "市场",
      auctions: "拍卖",
      auctionsSoon: "即将推出",
      startups: "初创公司",
      ideas: "创意",
      auction: "拍卖",
      investors: "投资人",
      partners: "合作伙伴",
      favorites: "收藏",
      analyzer: "分析器",
      chats: "聊天",
      profile: "个人中心",
      login: "登录",
      register: "注册",
      admin: "管理员",
    },
    hero: {
      title: "创业项目与创意市场平台",
      subtitle:
        "发布项目、寻找投资人和合作伙伴，并在拍卖中竞价 — 一切尽在此处。",
      ctaSell: "出售创业项目",
      ctaIdea: "发布创意",
      ctaExplore: "浏览平台",
    },
    home: {
      statsStartups: "初创公司",
      statsIdeas: "创意",
      statsAuctions: "正在进行的拍卖",

      howItWorksTitle: "运作方式",
      howItWorksText:
        "创建个人资料，发布初创公司或创意，然后从投资人和合作伙伴获得回应。如果项目正在进行拍卖 — 你可以看到当前价格和竞拍结束时间。",

      foundersTitle: "面向创始人",
      foundersText:
        "通过拍卖出售股权/权利，或在请求信息流中直接找到合作伙伴和资金。",

      investorsTitle: "面向投资人",
      investorsText:
        "浏览项目，保存收藏，并跟踪正在进行的竞拍。基础评价和评分能帮助你更快建立信任。",

      whyTitle: "为什么是 StartupHub",
      whyText:
        "StartupHub 将发布与搜索初创公司/创意、投资与合作请求，以及通过拍卖进行交易的机制整合到一个界面中。我们让流程更清晰：状态、卡片、快速表单与透明的加载提示。",

      favoritesBtn: "收藏",
      auctionsBtn: "查看拍卖",

      lastStartups: "最新初创公司",
      lastIdeas: "最新创意",
      lastAuctions: "正在进行的拍卖",

      seeAll: "查看全部",
    },
    pages: {
      addStartup: "+ 添加初创公司",
      addIdea: "+ 发布创意",
      addInvestor: "+ 创建请求",
      addPartner: "+ 创建请求",

      noActiveAuctions: "暂无进行中的拍卖。",
      loginToSaveFavoritesPrefix: "要保存收藏，请",
      loginToSaveFavoritesLink: "登录",
      loginToSaveFavoritesSuffix: "。",
      emptyFavorites: "目前没有已保存的内容。",

      emptyInvestors: "暂无投资请求。",
      emptyPartners: "暂无合作请求。",

      settings: "设置",
      profileSettingsTitle: "个人资料设置",
      status: "状态",
      save: "保存",
      logout: "退出账号",
      publicProfileLink: "公开资料页",
      delete: "删除",
      deleteConfirm: "确定删除？此操作无法撤销。",
    },
    userPublic: {
      loadError: "无法加载资料",
      notFound: "未找到用户",
      activityTitle: "活动记录",
      activityEmpty: "暂无条目",
      chatCta: "与该用户聊天",
      chatSelf: "这是您本人",
      chatStubTitle: "聊天",
      chatStubText: "用户间私信将在后续版本提供。",
      chatStubBack: "返回资料",
      statsStartups: "初创公司",
      statsIdeas: "创意",
      bioEmpty: "尚未填写简介。",
      activity: {
        user_registered: "注册平台",
        startup_created: "发布了初创公司",
        idea_created: "发布了创意",
        bid_placed: "拍卖出价",
        review_written: "评价了",
        investor_request: "投资人请求",
        partner_request: "合作请求",
        favorite_added: "加入收藏",
      },
    },
    chatsPage: {
      title: "聊天",
      emptyList: "暂无对话。可从用户资料页发起聊天。",
      loginRequired: "请登录后查看私信。",
      loadError: "无法加载聊天列表",
      threadLoadError: "无法打开聊天",
      cannotSelf: "不能与自己聊天。",
      messagePlaceholder: "输入消息…",
      send: "发送",
      you: "我",
      lastMessageYou: "我：",
      lead: "",
      load: "",
      status: "",
    },
    analyzer: {
      breadcrumb: "分析器",
      title: "创业公司分析",
      backToStartups: "返回初创公司",

      modes: { startup: "创业公司", idea: "创意" },
      stages: {
        idea: "创意",
        seed: "Seed（早期）",
        series_a: "A轮",
        series_b: "B轮",
        growth: "增长",
        exit: "退出",
      },
      steps: { market: "市场", traction: "增长", unit: "单元经济", finance: "财务与风险", report: "报告" },
      section: { market: "市场与定位", traction: "增长与团队", unit: "单元经济", finance: "财务与风险画像" },
      help: {
        market: "评估市场验证与竞争。验证越高，风险越低。",
        traction: "评估你的增长和团队实力。",
        unit: "填写毛利率、流失率（churn）以及单元经济关键参数。",
        finance: "提供烧钱速度、现金与风险水平。",
      },
      fields: {
        marketValidation: "市场验证",
        competition: "竞争强度",
        moatStrength: "护城河强度",
        tractionScore: "增长指数",
        teamStrength: "团队实力",
        grossMargin: "毛利率",
        monthlyChurnPct: "每月流失率",
        growthMonthly: "每月增长",
        monthlyRevenue: "每月收入 (₽)",
        activeUsers: "活跃用户",
        arpu: "ARPU (₽)",
        cac: "获客成本 (₽)",
        paybackMonths: "回收期（个月）",
        recurringShare: "经常性收入占比",
        burnMonthly: "每月烧钱 (₽)",
        cashOnHand: "现金余额 (₽)",
        regulatory: "监管风险",
        tech: "技术风险",
      },

      fieldHelp: {
        marketValidation:
          "市场验证程度：是否已经通过销售/试点得到证实。越高风险越低。",
        competition:
          "竞争强度：现有对手有多强、进入是否容易。越高风险越大。",
        moatStrength:
          "护城河：很难被复制的长期优势（品牌、网络效应、独特技术、低成本等）。",
        tractionScore:
          "增长/验证速度：产品证明需求的速度（增长/留存/参与）。越高越好。",
        teamStrength: "团队实力：经验、学习速度、执行计划的能力。",
        grossMargin: "毛利率：扣除直接成本后剩下的利润比例。越高越健康。",
        monthlyChurnPct: "Churn：每月流失的客户占比。越低 LTV 越高。",
        growthMonthly: "每月增长：你的关键指标增长速度（用户/收入）。",
        arpu: "ARPU：每月每个活跃用户带来的平均收入。",
        cac: "CAC：获客成本（吸引一个客户/用户需要花多少钱）。",
        paybackMonths: "回收期：通过毛利覆盖 CAC 所需要的月数。",
        recurringShare: "经常性收入占比：订阅/合同/定期付款带来的比例。",
        burnMonthly: "每月烧钱：你每月花掉的现金（团队、市场、基础设施等）。",
        cashOnHand: "现金余额：你目前手头的资金，用于支撑到下一阶段。",
        regulatory: "监管风险：法律/合规带来的不确定性。",
        tech: "技术风险：产品维护与技术栈可靠性的难度。",
      },

      levels: { low: "低", medium: "中", high: "高" },
      tip: { market: "如何评估市场", traction: "如何评估增长", unit: "如何评估单元经济", finance: "如何评估财务" },
      tipText: {
        market: "有稳定销售、试点和可复用的需求，验证更高。",
        traction: "评估产品证明需求的速度（增长/留存/参与）。",
        unit: "毛利率与 churn 直接决定 LTV 与增长可持续性。",
        finance: "Runway（生存期）是关键风险因素。",
      },
      actions: {
        back: "返回",
        next: "下一步",
        calculate: "计算",
        edit: "编辑",
        save: "保存分析",
        dontSave: "不保存",
        backToAnalyzer: "返回分析器",
        createStartupWithAnalysis: "用此分析创建创业项目",
        createIdeaWithAnalysis: "用此分析创建创意",
        saving: "保存中…",
        loginToSave: "登录以保存分析",
      },
      risk: { low: "低风险", medium: "中风险", high: "高风险" },
      report: {
        radarTitle: "优势可视化",
        summaryTitle: "核心结论",
        probability: "成功概率",
        risk: "风险等级",
        runway: "生存期",
        burn: "烧钱",
        expectedValue: "期望价值 (E[V])",
        expectedValueHint: "已根据成功概率调整",
        unitEconomicsTitle: "单元经济",
        ltv: "LTV",
        payback: "回收期",
        valuationTitle: "估值区间",
        valuationText1: "区间基于确定性规则计算（倍数 + 简化 DCF），不使用AI。",
        valuationLow: "下限",
        valuationHigh: "上限",
        financialTitle: "财务指标",
        arr: "ARR（经常性收入估算）",
        multiple: "倍数",
        breakeven: "盈亏平衡（月收入）",
        npv: "NPV（5年）",
        cashflowTitle: "现金流（5年）",
        riskBreakdownTitle: "风险拆解",
        riskDrivers: {
          market: "市场",
          competition: "竞争",
          execution: "执行/团队",
          financial: "财务稳定性",
          regulatory: "监管风险",
          tech: "技术风险",
        },
        riskNote: "数值越高，问题概率越大。",
        empty: "先填写问题并点击「计算」。",
        labels: { market: "市场", unit: "单元", traction: "增长", team: "团队", financial: "财务", risk: "风险" },
      },

      historyTitle: "你的分析历史",
      historyLogin: "登录以查看已保存的报告。",
      historySubtitle: "你的已保存报告与账号绑定。",
      historyLoading: "正在加载历史…",
      historyEmpty: "目前还没有保存的分析。",
      historyOpen: "打开",
      historyDelete: "删除",
    },
    auth: {
      loginTitle: "登录",
      registerTitle: "注册",
      emailOrPhone: "邮箱或手机号",
      password: "密码",
      name: "姓名",
      accountType: "账号类型",
      submitLogin: "登录",
      submitRegister: "创建账号",
      alreadyAuth: "你已登录。",
    },
    common: {
      loading: "加载中…",
      dbUnavailable: "数据库不可用，请稍后重试。",
      error: "错误",
      success: "完成",
    },
    footer: {
      description: "发布初创公司和创意，寻找投资人和合作伙伴，并参与拍卖的平台。",
      contacts: "联系方式: genstartup@yandex.ru",
      navTitle: "导航",
      helpTitle: "帮助",

      links: {
        home: "首页",
        startups: "初创公司",
        ideas: "创意",
        auction: "拍卖",
        investors: "投资人",
        partners: "合作伙伴",
        favorites: "收藏",
        analyzer: "分析器",
        chats: "聊天",
        profile: "个人中心",
      },
      help: {
        rules: "平台规则",
        privacy: "隐私政策",
        faq: "常见问题",
      },
    },
  },
};

export function t(lang: Lang, key: string): string {
  const dict = dictionaries[lang] ?? dictionaries.ru;
  const parts = key.split(".");
  let cur: any = dict;
  for (const p of parts) {
    cur = cur?.[p];
  }
  if (typeof cur === "string") return cur;
  return key;
}

