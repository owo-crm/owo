export const LANDING_CONFIG = {
  productName: "OWO CRM",
  tagline: "CRM для малого бизнеса",
  ctaUrl: "https://t.me/owocrm_bot",
  telegramUrl: "https://t.me/owocrm_bot",
  trialDays: 14,
  nav: {
    cta: "Начать бесплатно",
  },
  hero: {
    title: ["Заявки — в CRM.", "Письма — сами.", "Клиенты — не теряются."],
    subtitle:
      "OWO CRM собирает лидов из Google Sheets и форм на сайте, автоматически отправляет письма и показывает воронку продаж в удобном интерфейсе. Браузер или Telegram — как удобно.",
    primaryCta: "Начать бесплатно",
    secondaryCta: "Посмотреть как работает ↓",
    stats: "12 новых · 3 в работе · 5 закрыто",
    trustLine:
      "Работает в браузере и как Telegram Mini App · Бесплатный пробный период",
    leads: [
      {
        name: "Анна Петрова",
        status: "Новый",
        phone: "+48 601 123 456",
        tone: "new",
      },
      {
        name: "Marek Nowak",
        status: "Переговоры",
        phone: "+48 602 987 221",
        tone: "active",
      },
      {
        name: "Olga K.",
        status: "Ожидает",
        phone: "+48 603 551 891",
        tone: "warning",
      },
      {
        name: "Игорь Л.",
        status: "Закрыт",
        phone: "+48 604 771 903",
        tone: "closed",
      },
    ],
  },
  pain: {
    title: "Звучит знакомо?",
    cards: [
      {
        icon: "TableProperties",
        title: "Лиды теряются в таблице",
        body: "Google Sheet растёт, строки перемешиваются. Непонятно, кому нужно перезвонить, кто уже купил, а кто ждёт ответа вторую неделю.",
      },
      {
        icon: "Mail",
        title: "Письма отправляются вручную",
        body: "Каждый раз копипастить шаблон, подставлять имя, не забыть отправить. Это занимает время и всё равно что-то упускается.",
      },
      {
        icon: "BarChart2",
        title: "Воронка непрозрачна",
        body: "Сколько заявок пришло в этом месяце? Сколько конвертировалось? Где теряются клиенты? Ответа нет — только ощущение что что-то не так.",
      },
    ],
  },
  solution: {
    title: "OWO CRM берёт рутину на себя",
    subtitle:
      "Подключи источники лидов, настрой автоответы — и занимайся делом, а не таблицами.",
    features: [
      {
        kind: "import",
        title: "Твой Google Sheet → живая CRM за 5 минут",
        body: "Вставь ссылку на таблицу, укажи какая колонка — это имя, телефон, email. OWO подтянет всех клиентов и будет синхронизировать изменения.",
        note: "Поддержка любых вкладок и структур",
      },
      {
        kind: "email",
        title: "Письма уходят сами — в нужный момент",
        body: "Настрой триггеры: когда лид переходит в статус «Заявка принята» — клиент получает письмо. Когда сделка закрыта — получает подтверждение. Без участия менеджера.",
        note: "Шаблоны с персонализацией",
      },
      {
        kind: "sources",
        title: "Лиды из всех источников в одном месте",
        body: "Google Sheets, форма на твоём сайте, ручное добавление — все заявки попадают в единую воронку. Больше ничего не теряется.",
        note: "Форма с сайта",
        badge: "Скоро",
      },
    ],
  },
  howItWorks: {
    title: "Три шага до работающей CRM",
    steps: [
      {
        id: "01",
        title: "Подключи Google Sheet",
        body: "Вставь ссылку. OWO читает заголовки колонок и предлагает готовый маппинг. Ты только подтверждаешь.",
      },
      {
        id: "02",
        title: "Настрой воронку под себя",
        body: "Создай стадии: «Новый», «Переговоры», «Оплата», «Закрыт». Свои названия, свои цвета. Настрой автоматические письма для каждого этапа.",
      },
      {
        id: "03",
        title: "Работай — система сделает остальное",
        body: "Добавляй лидов, двигай по воронке. Письма уходят сами. Команда видит общую картину. Ты видишь аналитику.",
      },
    ],
  },
  access: {
    title: "Работай там, где удобно",
    browser: {
      title: "Полная версия в браузере",
      body: "Все функции, удобный интерфейс, большой экран. Открываешь как обычный сайт — никакой установки.",
    },
    telegram: {
      title: "Mini App в Telegram",
      body: "Для тех кто работает с телефона. Уведомления о новых лидах, быстрый ответ на задачи — прямо в Telegram.",
    },
  },
  useCases: {
    title: "Подходит для любого бизнеса с входящими заявками",
    items: [
      { icon: "Briefcase", label: "Агентства и консалтинг" },
      { icon: "Camera", label: "Фотографы и видеографы" },
      { icon: "Calendar", label: "Ивент-организаторы" },
      { icon: "Scissors", label: "Салоны и мастера" },
      { icon: "Dumbbell", label: "Студии и тренеры" },
      { icon: "ShoppingBag", label: "Малый бизнес с продажами" },
    ],
  },
  finalCta: {
    title: "Готов перестать терять клиентов?",
    subtitle:
      "Подключи Google Sheet, и через 5 минут у тебя будет живая CRM с автоматическими письмами.",
    button: "Начать бесплатно →",
    note: "Браузер или Telegram · Бесплатный пробный период · Без кредитной карты",
  },
  survey: {
    sectionId: "survey",
    title: "Early access опрос",
    subtitle:
      "Ответы займут 2–3 минуты. Мы используем их, чтобы настроить OWO CRM под ваш реальный процесс и приоритизировать запуск.",
    stepLabel: "Шаг",
    next: "Далее",
    back: "Назад",
    submit: "Отправить",
    successTitle: "Спасибо, заявка принята",
    successBody:
      "Мы сохранили ваши ответы в early access. Команда свяжется с вами после валидации.",
    requiredError: "Заполните все обязательные поля текущего шага.",
    submitError: "Не удалось отправить форму. Попробуйте еще раз.",
    consentLabel: "Согласен(на) на обратную связь по моей заявке.",
    steps: [
      {
        title: "Профиль бизнеса",
        fields: ["businessType", "teamSize"] as const,
      },
      {
        title: "Текущий процесс",
        fields: ["currentTools", "mainPains"] as const,
      },
      {
        title: "Приоритеты",
        fields: ["featurePriorities", "preferredWorkspace"] as const,
      },
      {
        title: "Интерфейс",
        fields: ["idealLeadCardNotes", "preferredStyle"] as const,
      },
      {
        title: "Готовность",
        fields: ["willingnessToPay", "earlyAccessInterest"] as const,
      },
      {
        title: "Контакты",
        fields: ["name", "email", "telegram", "preferredContact", "consent"] as const,
      },
    ],
    fields: {
      businessType: {
        label: "Какой у вас бизнес?",
        type: "select",
        placeholder: "Выберите вариант",
        options: [
          { value: "agency", label: "Агентство / консалтинг" },
          { value: "services", label: "Услуги / студия / мастер" },
          { value: "sales-team", label: "Малый отдел продаж" },
          { value: "freelance-team", label: "Фриланс-команда" },
        ],
      },
      teamSize: {
        label: "Размер команды, работающей с лидами",
        type: "select",
        placeholder: "Выберите размер",
        options: [
          { value: "solo", label: "1 человек" },
          { value: "2-5", label: "2-5 человек" },
          { value: "6-15", label: "6-15 человек" },
          { value: "16+", label: "16+ человек" },
        ],
      },
      currentTools: {
        label: "Какими инструментами пользуетесь сейчас?",
        type: "textarea",
        placeholder: "Google Sheets, Notion, CRM, Telegram, почта и т.д.",
      },
      mainPains: {
        label: "Главные боли в процессе лидов",
        type: "textarea",
        placeholder: "Что ломается чаще всего: потеря лидов, долгий ответ, хаос по стадиям...",
      },
      featurePriorities: {
        label: "Что для вас самое важное в OWO CRM?",
        type: "multi",
        options: [
          { value: "sheet-sync", label: "Синхронизация с Google Sheets" },
          { value: "auto-emails", label: "Автоматические письма" },
          { value: "pipeline", label: "Воронка и статусы" },
          { value: "team-visibility", label: "Прозрачность для команды" },
          { value: "analytics", label: "Аналитика и конверсия" },
        ],
      },
      preferredWorkspace: {
        label: "Где вам удобнее работать?",
        type: "select",
        placeholder: "Выберите вариант",
        options: [
          { value: "browser", label: "Веб-версия (браузер)" },
          { value: "telegram", label: "Telegram Mini App" },
          { value: "both", label: "Оба варианта" },
        ],
      },
      idealLeadCardNotes: {
        label: "Какие данные в карточке лида критичны?",
        type: "textarea",
        placeholder: "Имя, телефон, источник, статус, сумма, комментарии...",
      },
      preferredStyle: {
        label: "Какой интерфейс вам ближе?",
        type: "select",
        placeholder: "Выберите стиль",
        options: [
          { value: "minimal", label: "Минималистичный" },
          { value: "rich", label: "Больше деталей на экране" },
          { value: "balanced", label: "Баланс" },
        ],
      },
      willingnessToPay: {
        label: "Комфортный бюджет в месяц",
        type: "select",
        placeholder: "Выберите диапазон",
        options: [
          { value: "0-20", label: "€0-20" },
          { value: "20-50", label: "€20-50" },
          { value: "50-100", label: "€50-100" },
          { value: "100+", label: "€100+" },
        ],
      },
      earlyAccessInterest: {
        label: "Готовность зайти в early access",
        type: "select",
        placeholder: "Выберите вариант",
        options: [
          { value: "asap", label: "Готов(а) сразу" },
          { value: "after-demo", label: "После короткого демо" },
          { value: "just-updates", label: "Пока только новости" },
        ],
      },
      name: {
        label: "Имя",
        type: "input",
        placeholder: "Ваше имя",
      },
      email: {
        label: "Email",
        type: "input",
        inputType: "email",
        placeholder: "name@company.com",
      },
      telegram: {
        label: "Telegram (необязательно)",
        type: "input",
        placeholder: "@username",
      },
      preferredContact: {
        label: "Предпочтительный канал связи",
        type: "select",
        placeholder: "Выберите канал",
        options: [
          { value: "telegram", label: "Telegram" },
          { value: "email", label: "Email" },
        ],
      },
    },
  },
  footer: {
    note: "© 2025 OWO CRM",
    linkLabel: "Открыть в Telegram",
  },
} as const;

export type LandingConfig = typeof LANDING_CONFIG;
