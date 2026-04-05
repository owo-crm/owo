export type LandingLocale = "pl" | "en";

type LeadTone = "new" | "active" | "warning" | "closed";

type LandingCopy = {
  tagline: string;
  nav: {
    cta: string;
  };
  hero: {
    prelaunchBadge: string;
    title: [string, string, string];
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    stats: string;
    trustLine: string;
    leads: Array<{
      name: string;
      status: string;
      phone: string;
      tone: LeadTone;
    }>;
  };
  pain: {
    title: string;
    cards: Array<{
      icon: "TableProperties" | "Mail" | "BarChart2";
      title: string;
      body: string;
    }>;
  };
  solution: {
    title: string;
    subtitle: string;
    features: Array<
      | {
          kind: "import";
          title: string;
          body: string;
          note: string;
        }
      | {
          kind: "email";
          title: string;
          body: string;
          note: string;
        }
      | {
          kind: "sources";
          title: string;
          body: string;
          note: string;
          badge: string;
        }
    >;
    visuals: {
      importSource: string;
      importTarget: string;
      emailTitle: string;
      emailStatus: string;
      emailBody: string;
      sourceA: string;
      sourceB: string;
      sourceC: string;
      unifiedFunnel: string;
    };
  };
  howItWorks: {
    title: string;
    steps: Array<{
      id: "01" | "02" | "03";
      title: string;
      body: string;
    }>;
  };
  access: {
    title: string;
    betweenLabel: string;
    browser: {
      title: string;
      body: string;
    };
    telegram: {
      title: string;
      body: string;
    };
  };
  useCases: {
    title: string;
    items: Array<{
      icon:
        | "Briefcase"
        | "Camera"
        | "Calendar"
        | "Scissors"
        | "Dumbbell"
        | "ShoppingBag";
      label: string;
    }>;
  };
  finalCta: {
    title: string;
    subtitle: string;
    button: string;
    note: string;
  };
  survey: {
    sectionId: string;
  };
  footer: {
    note: string;
    linkLabel: string;
  };
};

const LANDING_COPY: Record<LandingLocale, LandingCopy> = {
  pl: {
    tagline: "CRM dla małego biznesu · Wczesny dostęp",
    nav: {
      cta: "Zapisz się na wcześniejszy dostęp",
    },
    hero: {
      prelaunchBadge: "Wkrótce startujemy — zapisz się pierwszy",
      title: ["Zgłoszenie.", "Oferta. Umowa.", "Bez chaosu."],
      subtitle:
        "Klient się zgłasza — i zaczyna się chaos. Kto odpisuje? Kiedy wysłać ofertę? Gdzie jest umowa? OWO CRM prowadzi klienta od pierwszego kontaktu do zamknięcia: szybka odpowiedź, gotowa oferta, automatyczne wiadomości, wszystko w jednym miejscu.",
      primaryCta: "Zapisz się żeby uzyskać wcześniejszy dostęp",
      secondaryCta: "Jak to działa? ↓",
      stats: "12 nowych · 3 w toku · 5 zamkniętych",
      trustLine:
        "Działa w przeglądarce i na telefonie · Bezpłatny dostęp dla pierwszych uczestników",
      leads: [
        {
          name: "Julia Wiśniewska",
          status: "Nowy",
          phone: "+48 601 123 456",
          tone: "new",
        },
        {
          name: "Marek Nowak",
          status: "W kontakcie",
          phone: "+48 602 987 221",
          tone: "active",
        },
        {
          name: "Anna K.",
          status: "Oferta",
          phone: "+48 603 551 891",
          tone: "warning",
        },
        {
          name: "Igor L.",
          status: "Zamknięty",
          phone: "+48 604 771 903",
          tone: "closed",
        },
      ],
    },
    pain: {
      title: "Brzmi znajomo?",
      cards: [
        {
          icon: "TableProperties",
          title: "Zgłoszenia giną w chaosie",
          body: "Klient pisze — odpowiadasz za dwa dni. Albo zapominasz. Nie wiadomo kto jest na jakim etapie, kto czeka na ofertę, a kto już poszedł do konkurencji.",
        },
        {
          icon: "Mail",
          title: "Oferta, maile, umowy — wszystko ręcznie",
          body: "Za każdym razem od nowa: kopiujesz tekst, wpisujesz dane klienta, wysyłasz. Albo zapominasz. To zabiera czas, który mógłbyś poświęcić na klientów.",
        },
        {
          icon: "BarChart2",
          title: "Nie wiesz gdzie tracisz klientów",
          body: "Ile zapytań przyszło w tym miesiącu? Ile zostało klientami? Na jakim etapie odpadają? Nie ma jednej odpowiedzi — tylko poczucie że coś gdzieś ucieka.",
        },
      ],
    },
    solution: {
      title: "OWO CRM przejmuje rutynę. Ty zajmujesz się klientami.",
      subtitle:
        "Podłącz swoje źródło zgłoszeń, ustaw automatyczne wiadomości i szablony — i zajmij się klientami, nie papierologią.",
      features: [
        {
          kind: "import",
          title: "Wszystkie zgłoszenia w jednym miejscu",
          body: "Formularz na stronie, polecenia, reklama, arkusz — skąd klient by nie przyszedł, trafia do jednej listy. Widzisz kto czeka, kto jest w toku, kto wymaga pilnej odpowiedzi.",
          note: "Działa z każdym źródłem zgłoszeń",
        },
        {
          kind: "email",
          title: "Oferta i potwierdzenie wysyłają się same",
          body: "Klient się zgłasza — dostaje automatyczne potwierdzenie. Przechodzi do kolejnego etapu — dostaje ofertę z jego danymi. Nie musisz nic robić ręcznie.",
          note: "Szablony z danymi klienta",
        },
        {
          kind: "sources",
          title: "Klient pod kontrolą od A do Z",
          body: "Od pierwszego kontaktu do podpisanej umowy — widzisz każdy krok. Notatki, historia wiadomości, zadania, dokumenty — wszystko przy kliencie, nic się nie gubi.",
          note: "Pełna historia klienta",
          badge: "Wkrótce",
        },
      ],
      visuals: {
        importSource: "Źródła zgłoszeń",
        importTarget: "OWO CRM klienci",
        emailTitle: "Wiadomość do klienta",
        emailStatus: "Wysłano",
        emailBody: "Dzień dobry, Julia. Twoje zgłoszenie zostało przyjęte, opiekun już został przypisany.",
        sourceA: "Formularz",
        sourceB: "Polecenie",
        sourceC: "Ręcznie",
        unifiedFunnel: "Jedna lista OWO CRM",
      },
    },
    howItWorks: {
      title: "Trzy kroki i system działa",
      steps: [
        {
          id: "01",
          title: "Dodaj swoje zgłoszenia",
          body: "Wgraj listę klientów, podłącz formularz ze strony lub dodaj ręcznie. OWO rozpoznaje dane i od razu pokazuje wszystkich w jednym widoku.",
        },
        {
          id: "02",
          title: "Ustaw etapy swojego procesu",
          body: "Stwórz etapy które pasują do Twojego biznesu: Nowy, W kontakcie, Oferta wysłana, Zamknięty. Do każdego możesz dodać automatyczną wiadomość lub szablon dokumentu.",
        },
        {
          id: "03",
          title: "Pracuj — system robi resztę",
          body: "Przesuwaj klientów przez etapy. Potwierdzenia i oferty wysyłają się same. Widzisz kto czeka na odpowiedź i ile zapytań zostało klientami.",
        },
      ],
    },
    access: {
      title: "Działa tam, gdzie już jesteś",
      betweenLabel: "lub",
      browser: {
        title: "Pełna wersja w przeglądarce",
        body: "Otwierasz jak zwykłą stronę — bez instalowania czegokolwiek. Wszystkie funkcje, duży ekran, wygodny widok.",
      },
      telegram: {
        title: "Wersja mobilna — Telegram lub WhatsApp",
        body: "Dla tych, którzy wolą telefon. Powiadomienia o nowych zgłoszeniach i szybki podgląd klientów — bez otwierania laptopa.",
      },
    },
    useCases: {
      title: "Dla każdego, kto prowadzi klientów i chce robić to sprawniej",
      items: [
        { icon: "Briefcase", label: "Agencje eventowe" },
        { icon: "Camera", label: "Fotografowie i videografowie" },
        { icon: "Calendar", label: "Organizatorzy imprez" },
        { icon: "Scissors", label: "Salony i specjaliści" },
        { icon: "Dumbbell", label: "Studia i trenerzy" },
        { icon: "ShoppingBag", label: "Małe firmy usługowe" },
      ],
    },
    finalCta: {
      title: "Pierwsze miejsca na wcześniejszy dostęp są otwarte",
      subtitle:
        "Zapisz się, zanim ruszymy. Pierwsi uczestnicy otrzymają dostęp za darmo i pomogą nam dostosować system do ich procesu.",
      button: "Zapisz się żeby uzyskać wcześniejszy dostęp →",
      note: "Przeglądarka lub telefon · Bezpłatny dostęp dla pierwszych · Bez karty kredytowej",
    },
    survey: {
      sectionId: "survey",
    },
    footer: {
      note: "© 2026 OWO CRM",
      linkLabel: "Otwórz w Telegram",
    },
  },
  en: {
    tagline: "CRM for small business · Early access",
    nav: {
      cta: "Sign up for early access",
    },
    hero: {
      prelaunchBadge: "We launch soon — join first",
      title: ["Inquiry.", "Offer. Contract.", "No chaos."],
      subtitle:
        "A client reaches out — and chaos starts. Who replies? When do you send the offer? Where is the contract? OWO CRM guides each client from first contact to close: fast reply, ready offer, automatic messages, everything in one place.",
      primaryCta: "Sign up to get early access",
      secondaryCta: "How does it work? ↓",
      stats: "12 new · 3 in progress · 5 closed",
      trustLine: "Works in browser and on phone · Free access for first participants",
      leads: [
        {
          name: "Julia Wisniewska",
          status: "New",
          phone: "+48 601 123 456",
          tone: "new",
        },
        {
          name: "Mark Nowak",
          status: "In contact",
          phone: "+48 602 987 221",
          tone: "active",
        },
        {
          name: "Anna K.",
          status: "Offer sent",
          phone: "+48 603 551 891",
          tone: "warning",
        },
        {
          name: "Igor L.",
          status: "Closed",
          phone: "+48 604 771 903",
          tone: "closed",
        },
      ],
    },
    pain: {
      title: "Sounds familiar?",
      cards: [
        {
          icon: "TableProperties",
          title: "Client requests disappear in the chaos",
          body: "A client writes — you answer two days later. Or forget. Nobody knows who is at which stage, who waits for an offer, and who already moved to a competitor.",
        },
        {
          icon: "Mail",
          title: "Offers, emails, contracts — all manual",
          body: "Every time from scratch: copy text, fill customer data, send. Or forget. It takes time you could spend on real client conversations.",
        },
        {
          icon: "BarChart2",
          title: "You don't know where you lose clients",
          body: "How many inquiries came this month? How many converted? At which stage do they drop? No clear answer — only the feeling that value leaks somewhere.",
        },
      ],
    },
    solution: {
      title: "OWO CRM handles routine. You focus on clients.",
      subtitle:
        "Connect your lead sources, set automatic messages and templates — and focus on clients, not admin chaos.",
      features: [
        {
          kind: "import",
          title: "All inquiries in one place",
          body: "Website form, referrals, ads, spreadsheet — wherever clients come from, everything lands in one list. You instantly see who waits, who is in progress, and who needs a fast reply.",
          note: "Works with any lead source",
        },
        {
          kind: "email",
          title: "Offers and confirmations send automatically",
          body: "Client submits an inquiry — gets instant confirmation. Client moves to next stage — gets an offer with their details. No repetitive manual sending.",
          note: "Templates with client data",
        },
        {
          kind: "sources",
          title: "Client fully controlled from A to Z",
          body: "From first contact to signed contract — every step stays visible. Notes, message history, tasks, documents — all attached to one client timeline.",
          note: "Full client history",
          badge: "Soon",
        },
      ],
      visuals: {
        importSource: "Lead sources",
        importTarget: "OWO CRM clients",
        emailTitle: "Client message",
        emailStatus: "Sent",
        emailBody: "Hello Julia. Your inquiry has been accepted and an owner has been assigned.",
        sourceA: "Form",
        sourceB: "Referral",
        sourceC: "Manual",
        unifiedFunnel: "One OWO CRM list",
      },
    },
    howItWorks: {
      title: "Three steps and it works",
      steps: [
        {
          id: "01",
          title: "Add your inquiries",
          body: "Upload your client list, connect a website form, or add manually. OWO recognizes key data and shows everything in one clear view.",
        },
        {
          id: "02",
          title: "Set stages for your process",
          body: "Create stages that fit your business: New, In contact, Offer sent, Closed. Add an automatic message or document template for each stage.",
        },
        {
          id: "03",
          title: "Work — system handles the rest",
          body: "Move clients through stages. Confirmations and offers go out automatically. You see who waits for a reply and how many inquiries become customers.",
        },
      ],
    },
    access: {
      title: "Works where you already are",
      betweenLabel: "or",
      browser: {
        title: "Full browser version",
        body: "Open it like a normal website — no installation needed. Full functionality, big screen, and a comfortable operational view.",
      },
      telegram: {
        title: "Mobile version — Telegram or WhatsApp",
        body: "For teams that prefer phone-first work. New inquiry notifications and quick client overview — without opening a laptop.",
      },
    },
    useCases: {
      title: "For anyone managing clients and wanting to work faster",
      items: [
        { icon: "Briefcase", label: "Event agencies" },
        { icon: "Camera", label: "Photographers and videographers" },
        { icon: "Calendar", label: "Event organizers" },
        { icon: "Scissors", label: "Salons and specialists" },
        { icon: "Dumbbell", label: "Studios and coaches" },
        { icon: "ShoppingBag", label: "Small service businesses" },
      ],
    },
    finalCta: {
      title: "First early access spots are open",
      subtitle:
        "Join before launch. First participants get free access and help us tailor the system to their real process.",
      button: "Sign up to get early access →",
      note: "Browser or phone · Free access for first users · No credit card",
    },
    survey: {
      sectionId: "survey",
    },
    footer: {
      note: "© 2026 OWO CRM",
      linkLabel: "Open in Telegram",
    },
  },
};

export function resolveLandingLocale(raw: string | string[] | null | undefined): LandingLocale {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return "pl";

  const normalized = value.toLowerCase();
  if (normalized === "pl") return "pl";
  return "en";
}

export function getLandingConfig(locale: LandingLocale) {
  const localized = LANDING_COPY[locale] ?? LANDING_COPY.en;
  return {
    productName: "OWO CRM",
    ctaUrl: "https://t.me/owocrm_bot",
    telegramUrl: "https://t.me/owocrm_bot",
    trialDays: 14,
    ...localized,
  };
}

export type LandingConfig = ReturnType<typeof getLandingConfig>;
