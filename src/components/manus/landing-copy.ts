export type LandingLang = "pl" | "en";

export type LandingCopy = {
  nav: {
    links: Array<{ label: string; href: string }>;
    cta: string;
    langToggleAria: string;
  };
  hero: {
    badge: string;
    title1: string;
    title2: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
  };
  capabilities: {
    sectionLabel: string;
    heading: string;
    headingHighlight: string;
    cards: Array<{ id: string; title: string; description: string }>;
  };
  problem: {
    sectionLabel: string;
    heading: string;
    headingHighlight: string;
    cards: Array<{ number: string; title: string; body: string }>;
  };
  flow: {
    sectionLabel: string;
    heading: string;
    description: string;
    bullets: string[];
    stages: Array<{ title: string; description: string }>;
  };
  earlyAccess: {
    sectionLabel: string;
    heading: string;
    headingHighlight: string;
    description: string;
    successTitle: string;
    successBodyPrefix: string;
    labels: {
      name: string;
      email: string;
      teamSize: string;
      painPoint: string;
    };
    placeholders: {
      name: string;
      email: string;
      teamSize: string;
      painPoint: string;
    };
    teamSizeOptions: Array<{ value: string; label: string }>;
    submit: string;
    submitting: string;
    noSpam: string;
  };
  stats: {
    firstTitle: string;
    firstBody: string;
    secondTitle: string;
    secondBody: string;
  };
  access: {
    heading: string;
    webTitle: string;
    webBody: string;
    tgTitle: string;
    tgBody: string;
  };
  useCases: {
    sectionLabel: string;
    heading: string;
    headingHighlight: string;
    inPractice: string;
    tabs: Array<{ id: string; label: string; title: string; body: string; detail: string }>;
  };
  faq: {
    sectionLabel: string;
    heading: string;
    headingHighlight: string;
    description: string;
    items: Array<{ id: string; question: string; answer: string }>;
  };
  finalCta: {
    sectionLabel: string;
    heading: string;
    headingHighlight: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
  };
  footer: {
    strapline: string;
    navigation: string;
    connect: string;
    copyright: string;
    privacy: string;
    terms: string;
  };
};

const sharedLinks = [
  { href: "#problem" },
  { href: "#solution" },
  { href: "#how-it-works" },
  { href: "#use-cases" },
] as const;

export const landingCopyByLang: Record<LandingLang, LandingCopy> = {
  en: {
    nav: {
      links: [
        { ...sharedLinks[0], label: "Problem" },
        { ...sharedLinks[1], label: "Solution" },
        { ...sharedLinks[2], label: "How It Works" },
        { ...sharedLinks[3], label: "Use Cases" },
      ],
      cta: "Request Early Access",
      langToggleAria: "Switch landing language",
    },
    hero: {
      badge: "Early Access - Pre-Launch",
      title1: "Many lead sources.",
      title2: "One clear lead workflow.",
      description:
        "OWO CRM is a web-first CRM for teams that need clear ownership and visible next actions. Bring inquiries from Google Sheets, website forms, and API into one lead queue.",
      primaryCta: "Join Early Access",
      secondaryCta: "See How It Works",
    },
    capabilities: {
      sectionLabel: "Core Features",
      heading: "Speed, clarity, and",
      headingHighlight: "consistency.",
      cards: [
        {
          id: "unified-inbox",
          title: "Unified Lead Inbox",
          description:
            "Forms, ads, API, imports - all leads in one queue. No scattered sources. Clear ownership from day one.",
        },
        {
          id: "automail",
          title: "AutoMail Sequences",
          description:
            "First touch and follow-ups on autopilot. Your team stays responsive while the system handles timing and consistency.",
        },
        {
          id: "tasks",
          title: "Task Automation",
          description:
            "Deadlines, routing, accountability. Every action is tracked. No more 'I forgot to follow up' moments.",
        },
      ],
    },
    problem: {
      sectionLabel: "The Problem",
      heading: "The process breaks in",
      headingHighlight: "handoffs.",
      cards: [
        {
          number: "01",
          title: "Leads come from everywhere",
          body: "Forms, ads, messages, and calls bring inbound across channels. But handoffs break. No clear owner. No consistent follow-up. Good opportunities go cold.",
        },
        {
          number: "02",
          title: "No unified operational queue",
          body: "Spreadsheets, inbox threads, and chat updates split context. When someone asks what is next, the answer is usually scattered across tools.",
        },
        {
          number: "03",
          title: "Manual follow-up is fragile",
          body: "First response slips. Reminders are missed. Tasks stay implicit. Without automation and clear accountability, lead velocity drops fast.",
        },
      ],
    },
    flow: {
      sectionLabel: "How It Works",
      heading: "Many sources. One pipeline.",
      description:
        "From inquiry to close, every lead follows the same operational logic. Web is the primary workspace, and Telegram is a second surface for fast actions.",
      bullets: [
        "One lead, one owner",
        "Follow-up is driven by tasks",
        "Queue stays clear across channels",
      ],
      stages: [
        {
          title: "Ingest to one queue",
          description: "Google Sheet, website form, API",
        },
        {
          title: "Assign and trigger next action",
          description: "Narrow, reliable MVP automation",
        },
        {
          title: "Close with context",
          description: "Owner and next task stay visible",
        },
      ],
    },
    earlyAccess: {
      sectionLabel: "Pre-Launch",
      heading: "Join the",
      headingHighlight: "cohort.",
      description:
        "Apply for early access to help shape the MVP. We review requests in small waves and contact selected teams with next steps.",
      successTitle: "You're on the list.",
      successBodyPrefix: "We'll contact you at",
      labels: {
        name: "Full Name *",
        email: "Work Email *",
        teamSize: "Team Size",
        painPoint: "Biggest lead management challenge",
      },
      placeholders: {
        name: "Jane Smith",
        email: "jane@company.com",
        teamSize: "Select team size",
        painPoint: "e.g. We lose track of leads after the first call...",
      },
      teamSizeOptions: [
        { value: "solo", label: "Just me" },
        { value: "2-5", label: "2-5 people" },
        { value: "6-15", label: "6-15 people" },
        { value: "16-50", label: "16-50 people" },
        { value: "50+", label: "50+ people" },
      ],
      submit: "Request Early Access",
      submitting: "Submitting...",
      noSpam: "No spam. We only use this info to qualify and onboard early-access teams.",
    },
    stats: {
      firstTitle: "Limited cohort access",
      firstBody: "Early seats are opened in small batches.",
      secondTitle: "Feedback-driven rollout",
      secondBody: "Product scope is refined with each cohort wave.",
    },
    access: {
      heading: "One core workflow across surfaces.",
      webTitle: "Web-first workspace",
      webBody:
        "The main workspace for lead operations, ownership visibility, and next-task execution.",
      tgTitle: "Telegram as second surface",
      tgBody:
        "Fast notifications and mobile actions for the same core flow, not a separate product logic.",
    },
    useCases: {
      sectionLabel: "Use Cases",
      heading: "Built for teams that",
      headingHighlight: "work real pipelines.",
      inPractice: "In practice",
      tabs: [
        {
          id: "agencies",
          label: "Agencies",
          title: "Run high-volume inbound with clarity",
          body: "Agencies handle leads from ads, forms, referrals, and direct messages at the same time. OWO CRM keeps each opportunity in one operational queue from first inquiry to signed deal.",
          detail:
            "Assign owners, track next tasks, and keep context visible without hopping across disconnected tools.",
        },
        {
          id: "consulting",
          label: "Consulting",
          title: "Manage long B2B cycles without losing momentum",
          body: "Consulting deals involve multiple stakeholders and long follow-up windows. OWO CRM keeps touchpoints linked to owners and next actions so teams can move deals forward consistently.",
          detail: "Track stakeholder context, follow-up commitments, and task completion in one place.",
        },
        {
          id: "services",
          label: "Service Businesses",
          title: "Turn inquiries into scheduled work",
          body: "For service teams, speed and consistency matter more than fancy dashboards. OWO CRM helps teams respond quickly and keep follow-up visible until the job is booked or closed.",
          detail: "Use task-driven follow-up and owner visibility to reduce missed opportunities.",
        },
        {
          id: "smb",
          label: "Small Teams",
          title: "Graduate from spreadsheet chaos",
          body: "Small teams often start with shared sheets and chat threads. OWO CRM gives one structured pipeline without unnecessary complexity.",
          detail: "Start with the core loop: intake, ownership, next action, and visible follow-up.",
        },
      ],
    },
    faq: {
      sectionLabel: "FAQ",
      heading: "Practical answers for",
      headingHighlight: "early teams.",
      description: "This page reflects the current pre-launch scope and real MVP capabilities.",
      items: [
        {
          id: "mvp-scope",
          question: "What does OWO CRM solve in MVP?",
          answer:
            "MVP focuses on one loop: lead enters, owner becomes clear, next action is visible, and follow-up does not get lost. It is built for operational clarity, not for enterprise feature depth.",
        },
        {
          id: "lead-sources",
          question: "Which lead sources are supported right now?",
          answer:
            "Current canonical intake sources are Google Sheet, website form, and API. Manual lead creation is also part of the core workflow. All implemented sources converge into one pipeline.",
        },
        {
          id: "telegram-role",
          question: "Is Telegram the main product surface?",
          answer:
            "No. Web is the primary workspace. Telegram is a second surface for fast mobile actions and notifications on top of the same backend core.",
        },
        {
          id: "automation-scope",
          question: "How much automation is included at this stage?",
          answer:
            "Automation is intentionally narrow in MVP: owner-assignment support, first-touch support, and follow-up task creation. A full workflow builder is not part of the current launch scope.",
        },
        {
          id: "early-access",
          question: "What is included in early access?",
          answer:
            "Early access gives selected teams guided onboarding, direct feedback channel with the product team, and access to the current MVP workflow. Feature scope can evolve between cohort waves based on feedback.",
        },
        {
          id: "not-included",
          question: "What is not included yet?",
          answer:
            "Out of MVP scope today: deep workflow builder, giant integration marketplace, full enterprise customization, and finance-first or inventory-first product buildout.",
        },
        {
          id: "data-safety",
          question: "How do you handle data and basic security?",
          answer:
            "We collect only the data needed to run lead operations and improve onboarding. Access is business-scoped in the app. We avoid unverified compliance claims on this page and share detailed security posture directly with onboarded teams.",
        },
        {
          id: "onboarding-support",
          question: "How does onboarding work at the start?",
          answer:
            "After you apply, we review fit and contact selected teams. Initial onboarding is hands-on and focused on getting one reliable lead-to-task flow running quickly.",
        },
      ],
    },
    finalCta: {
      sectionLabel: "Early Access",
      heading: "Build a lead operation your team can",
      headingHighlight: "trust.",
      body: "Join the pre-launch cohort and start with one reliable pipeline before you scale.",
      primaryCta: "Join Early Access",
      secondaryCta: "See How It Works",
    },
    footer: {
      strapline: "One operational pipeline from inquiry to close.",
      navigation: "Navigation",
      connect: "Connect",
      copyright: "Pre-launch. All rights reserved.",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
    },
  },
  pl: {
    nav: {
      links: [
        { ...sharedLinks[0], label: "Problem" },
        { ...sharedLinks[1], label: "Rozwiązanie" },
        { ...sharedLinks[2], label: "Jak to działa" },
        { ...sharedLinks[3], label: "Przykłady użycia" },
      ],
      cta: "Poproś o Early Access",
      langToggleAria: "Przełącz język strony",
    },
    hero: {
      badge: "Early Access - Przed premierą",
      title1: "Wiele źródeł leadów.",
      title2: "Jeden jasny proces leadów.",
      description:
        "OWO CRM to web-first CRM dla zespołów, które potrzebują jasnego ownera i widocznego następnego kroku. Zbieraj zapytania z Google Sheets, formularzy www i API do jednej kolejki leadów.",
      primaryCta: "Dołącz do Early Access",
      secondaryCta: "Zobacz jak to działa",
    },
    capabilities: {
      sectionLabel: "Kluczowe funkcje",
      heading: "Szybkość, przejrzystość i",
      headingHighlight: "konsekwencja.",
      cards: [
        {
          id: "unified-inbox",
          title: "Wspólna skrzynka leadów",
          description:
            "Formularze, reklamy, API i importy - wszystko trafia do jednej kolejki. Bez chaosu między źródłami. Jasny owner od pierwszego dnia.",
        },
        {
          id: "automail",
          title: "Sekwencje AutoMail",
          description:
            "Pierwszy kontakt i follow-upy działają automatycznie. Zespół odpowiada szybciej, a system pilnuje czasu i spójności.",
        },
        {
          id: "tasks",
          title: "Automatyzacja zadań",
          description:
            "Terminy, routing i odpowiedzialność. Każde działanie jest śledzone. Koniec z \"zapomniałem odpisać\".",
        },
      ],
    },
    problem: {
      sectionLabel: "Problem",
      heading: "Proces psuje się na",
      headingHighlight: "przekazaniach.",
      cards: [
        {
          number: "01",
          title: "Leady wpadają z wielu miejsc",
          body: "Formularze, reklamy, wiadomości i telefony generują zapytania z wielu kanałów. Potem pojawia się chaos: brak ownera, brak spójnego follow-upu, wartościowe leady stygną.",
        },
        {
          number: "02",
          title: "Brak jednej operacyjnej kolejki",
          body: "Arkusze, wątki mailowe i czaty rozbijają kontekst. Gdy ktoś pyta \"co dalej\", odpowiedź zwykle jest rozsiana po narzędziach.",
        },
        {
          number: "03",
          title: "Ręczny follow-up jest kruchy",
          body: "Pierwsza odpowiedź się opóźnia, przypomnienia przepadają, zadania są tylko \"w głowie\". Bez automatyzacji i odpowiedzialności tempo pipeline'u spada.",
        },
      ],
    },
    flow: {
      sectionLabel: "Jak to działa",
      heading: "Wiele źródeł. Jeden pipeline.",
      description:
        "Od zapytania do zamknięcia - każdy lead przechodzi ten sam operacyjny flow. Web to główne środowisko pracy, a Telegram jest drugim interfejsem do szybkich akcji.",
      bullets: [
        "Jeden lead, jeden owner",
        "Follow-up jest oparty o zadania",
        "Kolejka pozostaje czytelna we wszystkich kanałach",
      ],
      stages: [
        {
          title: "Zbieranie do jednej kolejki",
          description: "Google Sheet, formularz www, API",
        },
        {
          title: "Przypisanie i kolejny krok",
          description: "Wąska, niezawodna automatyzacja MVP",
        },
        {
          title: "Zamknięcie z kontekstem",
          description: "Owner i następne zadanie są zawsze widoczne",
        },
      ],
    },
    earlyAccess: {
      sectionLabel: "Przed premierą",
      heading: "Dołącz do",
      headingHighlight: "kohorty.",
      description:
        "Aplikuj do early access i współtwórz MVP. Zgłoszenia przeglądamy falami i kontaktujemy się z wybranymi zespołami z kolejnymi krokami.",
      successTitle: "Jesteś na liście.",
      successBodyPrefix: "Skontaktujemy się z Tobą na",
      labels: {
        name: "Imię i nazwisko *",
        email: "E-mail służbowy *",
        teamSize: "Wielkość zespołu",
        painPoint: "Największe wyzwanie w obsłudze leadów",
      },
      placeholders: {
        name: "Jan Kowalski",
        email: "jan@firma.pl",
        teamSize: "Wybierz wielkość zespołu",
        painPoint: "np. Gubimy leady po pierwszym kontakcie...",
      },
      teamSizeOptions: [
        { value: "solo", label: "Tylko ja" },
        { value: "2-5", label: "2-5 osób" },
        { value: "6-15", label: "6-15 osób" },
        { value: "16-50", label: "16-50 osób" },
        { value: "50+", label: "50+ osób" },
      ],
      submit: "Poproś o Early Access",
      submitting: "Wysyłanie...",
      noSpam: "Bez spamu. Te dane wykorzystujemy wyłącznie do kwalifikacji i onboardingu zespołów early-access.",
    },
    stats: {
      firstTitle: "Ograniczony dostęp kohortowy",
      firstBody: "Miejsca otwieramy małymi falami.",
      secondTitle: "Rozwój oparty o feedback",
      secondBody: "Zakres produktu dopracowujemy po każdej kohorcie.",
    },
    access: {
      heading: "Jeden główny workflow na wielu powierzchniach.",
      webTitle: "Web-first workspace",
      webBody: "Główne miejsce pracy dla operacji leadowych, widoczności ownera i realizacji kolejnego kroku.",
      tgTitle: "Telegram jako drugi interfejs",
      tgBody: "Szybkie powiadomienia i mobilne akcje w tym samym flow, bez oddzielnej logiki produktu.",
    },
    useCases: {
      sectionLabel: "Przykłady użycia",
      heading: "Zaprojektowane dla zespołów, które",
      headingHighlight: "pracują na realnym pipeline.",
      inPractice: "W praktyce",
      tabs: [
        {
          id: "agencies",
          label: "Agencje",
          title: "Obsługa dużego inboundu bez chaosu",
          body: "Agencje mają leady z reklam, formularzy, poleceń i wiadomości bezpośrednich. OWO CRM trzyma każdą szansę w jednej kolejce od pierwszego zapytania do podpisanej umowy.",
          detail: "Przypisz ownera, pilnuj następnych zadań i utrzymuj kontekst bez skakania po narzędziach.",
        },
        {
          id: "consulting",
          label: "Konsulting",
          title: "Długie cykle B2B bez utraty tempa",
          body: "Procesy konsultingowe obejmują wielu interesariuszy i długi follow-up. OWO CRM utrzymuje kontakt i kolejne kroki przypisane do ownerów, by pipeline szedł do przodu.",
          detail: "Śledź kontekst interesariuszy, zobowiązania follow-up i realizację zadań w jednym miejscu.",
        },
        {
          id: "services",
          label: "Firmy usługowe",
          title: "Od zapytania do rezerwacji pracy",
          body: "W usługach liczą się szybkość i powtarzalność. OWO CRM pomaga odpowiadać szybciej i utrzymywać widoczny follow-up aż do zamknięcia lub rezerwacji.",
          detail: "Flow oparty o zadania i ownerów ogranicza utracone szanse.",
        },
        {
          id: "smb",
          label: "Małe zespoły",
          title: "Wyjście z chaosu arkuszy",
          body: "Małe zespoły zaczynają często od arkuszy i czatów. OWO CRM daje jeden uporządkowany pipeline bez zbędnej złożoności.",
          detail: "Start od podstawowego loopa: intake, owner, kolejny krok i widoczny follow-up.",
        },
      ],
    },
    faq: {
      sectionLabel: "FAQ",
      heading: "Konkretne odpowiedzi dla",
      headingHighlight: "wczesnych zespołów.",
      description: "Ta strona odzwierciedla aktualny etap pre-launch i realne możliwości MVP.",
      items: [
        {
          id: "mvp-scope",
          question: "Co OWO CRM rozwiązuje w MVP?",
          answer:
            "MVP skupia się na jednym cyklu: lead wpada, owner jest jasny, następny krok widoczny, follow-up nie ginie. To produkt pod operacyjną klarowność, nie pod enterprise feature depth.",
        },
        {
          id: "lead-sources",
          question: "Jakie źródła leadów są dostępne teraz?",
          answer:
            "Aktualnie kanoniczne źródła intake to Google Sheet, formularz www i API. Dostępne jest też ręczne dodawanie leadów. Wszystkie źródła trafiają do jednego pipeline'u.",
        },
        {
          id: "telegram-role",
          question: "Czy Telegram to główna powierzchnia produktu?",
          answer:
            "Nie. Web to główne środowisko pracy. Telegram to drugi interfejs do szybkich mobilnych akcji i powiadomień nad tym samym backendem.",
        },
        {
          id: "automation-scope",
          question: "Jak szeroka jest automatyzacja na tym etapie?",
          answer:
            "Automatyzacja w MVP jest celowo wąska: wsparcie przypisania ownera, pierwszy kontakt i tworzenie follow-up tasków. Pełny builder workflow nie jest częścią obecnego zakresu.",
        },
        {
          id: "early-access",
          question: "Co obejmuje early access?",
          answer:
            "Early access daje wybranym zespołom onboarding prowadzony ręcznie, bezpośredni kanał feedbacku i dostęp do bieżącego workflow MVP. Zakres funkcji może się zmieniać między falami kohort.",
        },
        {
          id: "not-included",
          question: "Czego jeszcze nie ma?",
          answer:
            "Poza zakresem MVP: rozbudowany workflow builder, ogromny marketplace integracji, pełna enterprise customizacja oraz produkt budowany głównie pod finanse lub magazyn.",
        },
        {
          id: "data-safety",
          question: "Jak podchodzicie do danych i bezpieczeństwa?",
          answer:
            "Zbieramy tylko dane potrzebne do pracy na leadach i poprawy onboardingu. Dostęp w aplikacji jest scoped per business. Na tej stronie nie składamy niezweryfikowanych deklaracji compliance.",
        },
        {
          id: "onboarding-support",
          question: "Jak wygląda onboarding na starcie?",
          answer:
            "Po zgłoszeniu oceniamy dopasowanie i kontaktujemy wybrane zespoły. Wstępny onboarding jest hands-on i skupia się na szybkim uruchomieniu jednego niezawodnego flow lead-to-task.",
        },
      ],
    },
    finalCta: {
      sectionLabel: "Early Access",
      heading: "Zbuduj operację leadową, której zespół może",
      headingHighlight: "ufać.",
      body: "Dołącz do kohorty pre-launch i uruchom jeden niezawodny pipeline zanim zaczniesz skalować.",
      primaryCta: "Dołącz do Early Access",
      secondaryCta: "Zobacz jak to działa",
    },
    footer: {
      strapline: "Jeden operacyjny pipeline od zapytania do zamknięcia.",
      navigation: "Nawigacja",
      connect: "Kontakt",
      copyright: "Przed premierą. Wszelkie prawa zastrzeżone.",
      privacy: "Polityka prywatności",
      terms: "Warunki korzystania",
    },
  },
};
