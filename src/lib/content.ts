export type LandingLanguage = "en" | "pl";

export type SurveyFormState = {
  businessType: string;
  teamSize: string;
  currentTools: string;
  mainPains: string;
  featurePriorities: string[];
  preferredWorkspace: string;
  idealLeadCardNotes: string;
  preferredStyle: string;
  willingnessToPay: string;
  earlyAccessInterest: string;
  name: string;
  email: string;
  telegram: string;
  preferredContact: string;
  consent: boolean;
};

export const surveyStorageKey = "owo-survey-v1";
export const languageStorageKey = "owo-landing-language";
export const developerTelegramHandle = "@Faceback_crm_bot";

const developerTelegramUrl = `https://t.me/${developerTelegramHandle.replace("@", "")}`;

export const initialSurveyState: SurveyFormState = {
  businessType: "",
  teamSize: "",
  currentTools: "",
  mainPains: "",
  featurePriorities: [],
  preferredWorkspace: "desktop_first",
  idealLeadCardNotes: "",
  preferredStyle: "",
  willingnessToPay: "",
  earlyAccessInterest: "",
  name: "",
  email: "",
  telegram: "",
  preferredContact: "telegram",
  consent: false,
};

export const landingContent = {
  en: {
    nav: {
      brand: "OWO CRM",
      proof: "Flow",
      core: "Advantages",
      survey: "Survey",
      cta: "Join early access",
    },
    hero: {
      eyebrow: "Built first for Meta ads operators",
      title: "Your Meta leads should not die in Google Sheets.",
      body: "OWO imports Facebook and Instagram ad leads, assigns an owner, triggers the first response, and keeps the next move visible before the lead goes cold.",
      points: [
        "Import ugly sheets into a real queue",
        "Send the first touch without waiting",
        "Keep owner and follow-up visible",
      ],
      primaryCta: "Join early access",
      secondaryCta: "See the flow",
      reward: {
        eyebrow: "Early access reward",
        title: "1 month of Basic free",
        body: "Complete the survey and we will reserve a free month for the first launch wave.",
      },
    },
    workflow: {
      eyebrow: "Lead path in one line",
      intro: "",
      items: [
        {
          badge: "01",
          title: "Meta lead",
          nodes: [],
          caption: "",
        },
        {
          badge: "02",
          title: "Google Sheet",
          nodes: [],
          caption: "",
        },
        {
          badge: "03",
          title: "Track in OWO CRM",
          nodes: [],
          caption: "",
        },
        {
          badge: "04",
          title: "Task + auto email",
          nodes: [],
          caption: "",
        },
        {
          badge: "05",
          title: "Sale",
          nodes: [],
          caption: "",
        },
      ],
    },
    advantages: {
      eyebrow: "Core advantage",
      title: "OWO fixes the first seconds after a paid lead lands.",
      intro: "",
      items: [
        {
          title: "Leads you can actually work",
          body: "OWO turns raw sheet rows into a lead workspace with source, owner, stage, and context in one place.",
        },
        {
          title: "First response without drift",
          body: "The initial message can fire immediately, before the lead cools down or disappears between tools.",
        },
        {
          title: "Clear tasks for the team",
          body: "Everyone sees who owns the lead, what happens next, and which items are still waiting for action.",
        },
      ],
    },
    secondaryOps: {
      eyebrow: "Close to the lead",
      title: "Finance, inventory, and visibility stay near the workflow.",
      intro: "",
      items: [
        {
          title: "Finance tracking",
          body: "Keep deal value and revenue context beside the lead instead of losing it between tabs and notes.",
        },
        {
          title: "Inventory context",
          body: "When sales depend on what is available, the team sees that context without leaving the lead flow.",
        },
        {
          title: "Operational visibility",
          body: "See what was imported, what still needs an owner, and where response time is slipping.",
        },
      ],
    },
    footer: {
      eyebrow: "OWO CRM",
      title: "Built for teams buying Meta leads, not for feeding one more spreadsheet.",
      body: "The first release is shaped around imported leads, fast first response, and cleaner task execution.",
      contactsTitle: "Contact",
      socialsTitle: "Channels",
      contacts: [
        {
          label: "Telegram",
          value: developerTelegramHandle,
          href: developerTelegramUrl,
        },
      ],
      socials: [
        { label: "Facebook" },
        { label: "Instagram" },
        { label: "TikTok" },
        { label: "YouTube" },
        { label: "Discord" },
        { label: "Telegram", href: developerTelegramUrl },
      ],
      note:
        "Slots for Facebook, Instagram, TikTok, YouTube, and Discord are ready. We will reveal them as soon as live links exist.",
      backToTop: "Back to top",
    },
    survey: {
      heading: "Early access survey",
      subheading:
        "Six compact steps focused on how your team really works today.",
      stepLabel: "Step",
      progressLabel: "Current step",
      next: "Continue",
      back: "Back",
      submit: "Join early access",
      saving: "Saving progress locally",
      rewardBadge: "1 month of Basic free",
      successTitle: "Thanks for helping shape OWO CRM.",
      successBody:
        "You are on the early access list. We reserved 1 month of Basic free for your participation.",
      successHelper:
        "The first launch wave opens inside the Telegram Mini App, and Telegram stays the fastest way to reach us directly.",
      developerContact: "Developer Telegram",
      submitError:
        "We could not save your submission right now. Please try again in a moment.",
      required: "Please complete the current step before continuing.",
      privacy:
        "We only use your answers to evaluate fit, shape the product, and contact you about early access.",
      steps: [
        {
          title: "Business profile",
          description:
            "Tell us what kind of business you run and how large the operating team is.",
        },
        {
          title: "Current pain",
          description:
            "Show us where friction, chaos, or lost time happens today.",
        },
        {
          title: "Workflow priorities",
          description:
            "Which workflows matter most, and where should the product focus first?",
        },
        {
          title: "Product preference",
          description:
            "What should the ideal workspace feel like and show by default?",
        },
        {
          title: "Commercial signal",
          description:
            "Help us understand how valuable a product like this would be.",
        },
        {
          title: "Contact",
          description:
            "Leave your details so we can reach out when early access opens.",
        },
      ],
      fields: {
        businessType: {
          label: "What kind of business are you running?",
          placeholder: "Choose the closest fit",
          options: [
            { value: "services", label: "Service business" },
            { value: "studio", label: "Studio / appointments" },
            { value: "agency", label: "Agency / creative team" },
            { value: "sales", label: "Lead-driven sales team" },
            { value: "other", label: "Other small business" },
          ],
        },
        teamSize: {
          label: "How big is the team that touches leads and operations?",
          placeholder: "Choose team size",
          options: [
            { value: "solo", label: "Just me" },
            { value: "2_5", label: "2-5 people" },
            { value: "6_15", label: "6-15 people" },
            { value: "16_plus", label: "16+ people" },
          ],
        },
        currentTools: {
          label: "How do you currently manage leads and operations?",
          placeholder:
            "Tell us what you use today. Spreadsheets, Telegram, Notion, notes, an existing CRM, email, anything useful.",
        },
        mainPains: {
          label: "What breaks most often today?",
          placeholder:
            "Describe what feels chaotic, slow, manual, or easy to lose.",
        },
        featurePriorities: {
          label: "What matters most right now?",
          options: [
            { value: "leads", label: "Leads and pipeline" },
            { value: "tasks", label: "Tasks and follow-up" },
            { value: "communication", label: "Communication history" },
            { value: "notifications", label: "Notifications" },
            { value: "stats", label: "Stats and visibility" },
            { value: "automation", label: "Automation" },
          ],
        },
        preferredWorkspace: {
          label: "Where do you expect to use a product like this most?",
          options: [
            { value: "desktop_first", label: "Mostly desktop / laptop" },
            { value: "balanced", label: "Balanced desktop and mobile" },
            { value: "mobile_first", label: "Mostly mobile" },
          ],
        },
        idealLeadCardNotes: {
          label: "What should be easiest to see first in a lead view?",
          placeholder: "Choose the most important starting point",
          options: [
            { value: "status_owner", label: "Status, owner, and lead priority" },
            { value: "next_action", label: "Next action and follow-up urgency" },
            { value: "communication", label: "Recent communication and notes" },
            { value: "money", label: "Deal value, pipeline, and revenue context" },
          ],
        },
        preferredStyle: {
          label: "What kind of interface feels best to work in?",
          placeholder: "Choose the closest style",
          options: [
            { value: "minimal_calm", label: "Minimal and calm" },
            { value: "dense_operational", label: "Dense and operational" },
            { value: "premium_dark", label: "Premium dark" },
            { value: "light_clean", label: "Light and clean" },
          ],
        },
        willingnessToPay: {
          label: "How much would you realistically pay if this solved your workflow?",
          placeholder: "Choose a range",
          options: [
            { value: "under_20", label: "Under $20 / month" },
            { value: "20_49", label: "$20-49 / month" },
            { value: "50_99", label: "$50-99 / month" },
            { value: "100_plus", label: "$100+ / month" },
          ],
        },
        earlyAccessInterest: {
          label: "If invited early, would you try it?",
          options: [
            { value: "yes", label: "Yes, definitely" },
            { value: "maybe", label: "Maybe, if it fits my workflow" },
            { value: "not_now", label: "Not right now" },
          ],
        },
        name: {
          label: "Name",
          placeholder: "Your name",
        },
        email: {
          label: "Email",
          placeholder: "you@company.com",
        },
        telegram: {
          label: "Telegram",
          placeholder: "@handle or phone",
        },
        preferredContact: {
          label: "Preferred contact",
          options: [
            { value: "telegram", label: "Telegram" },
            { value: "email", label: "Email" },
          ],
        },
        consent: {
          label:
            "I agree that OWO CRM may contact me about early access and product feedback.",
        },
      },
    },
  },
  pl: {
    nav: {
      brand: "OWO CRM",
      proof: "Flow",
      core: "Przewagi",
      survey: "Ankieta",
      cta: "Dołącz do early access",
    },
    hero: {
      eyebrow: "Zbudowane najpierw dla operatorów reklam Meta",
      title: "Twoje leady z Meta nie powinny umierać w Google Sheets.",
      body: "OWO zbiera leady z Facebooka i Instagrama, przypisuje ownera, uruchamia pierwszy kontakt i pokazuje następny ruch zanim lead zdąży ostygnąć.",
      points: [
        "Import arkusza w realną kolejkę",
        "Pierwszy kontakt bez ręcznego klikania",
        "Owner i follow-up widoczne od razu",
      ],
      primaryCta: "Dołącz do early access",
      secondaryCta: "Zobacz flow",
      reward: {
        eyebrow: "Nagroda za early access",
        title: "1 miesiąc Basic za darmo",
        body: "Wypełnij ankietę, a zarezerwujemy darmowy miesiąc w pierwszej fali wejścia.",
      },
    },
    workflow: {
      eyebrow: "Ścieżka leada w jednej linii",
      intro: "",
      items: [
        {
          badge: "01",
          title: "Meta lead",
          nodes: [],
          caption: "",
        },
        {
          badge: "02",
          title: "Google Sheet",
          nodes: [],
          caption: "",
        },
        {
          badge: "03",
          title: "Track lead in OWO CRM",
          nodes: [],
          caption: "",
        },
        {
          badge: "04",
          title: "Task + auto email",
          nodes: [],
          caption: "",
        },
        {
          badge: "05",
          title: "Sale",
          nodes: [],
          caption: "",
        },
      ],
    },
    advantages: {
      eyebrow: "Główna przewaga",
      title: "OWO naprawia pierwsze sekundy po wejściu płatnego leada.",
      intro: "",
      items: [
        {
          title: "Leady, na których da się pracować",
          body: "OWO zamienia surowe wiersze z arkusza w przestrzeń leadową ze źródłem, ownerem, etapem i kontekstem w jednym miejscu.",
        },
        {
          title: "Pierwsza odpowiedź bez poślizgu",
          body: "Początkowa wiadomość może wyjść natychmiast, zanim lead ostygnie albo zgubi się między narzędziami.",
        },
        {
          title: "Jasne taski dla zespołu",
          body: "Widać kto prowadzi leada, co ma wydarzyć się dalej i które tematy nadal czekają na ruch.",
        },
      ],
    },
    secondaryOps: {
      eyebrow: "Blisko leada",
      title: "Finanse, inventory i widoczność nie uciekają do innych zakładek.",
      intro: "",
      items: [
        {
          title: "Tracking finansów",
          body: "Wartość deala i kontekst przychodu zostają przy leadzie zamiast znikać między zakładkami i notatkami.",
        },
        {
          title: "Kontekst inventory",
          body: "Jeśli sprzedaż zależy od dostępności, zespół widzi ten kontekst bez wychodzenia z przepływu leada.",
        },
        {
          title: "Widoczność operacyjna",
          body: "Od razu widać co zostało zaimportowane, co nadal nie ma ownera i gdzie tempo odpowiedzi siada.",
        },
      ],
    },
    footer: {
      eyebrow: "OWO CRM",
      title: "CRM pod Meta leady, nie pod doklejanie kolejnego arkusza.",
      body: "Pierwsze wydanie budujemy wokół importowanych leadów, szybkiej pierwszej odpowiedzi i czystszej egzekucji zadań.",
      contactsTitle: "Kontakt",
      socialsTitle: "Kanały",
      contacts: [
        {
          label: "Telegram",
          value: developerTelegramHandle,
          href: developerTelegramUrl,
        },
      ],
      socials: [
        { label: "Facebook" },
        { label: "Instagram" },
        { label: "TikTok" },
        { label: "YouTube" },
        { label: "Discord" },
        { label: "Telegram", href: developerTelegramUrl },
      ],
      note:
        "Miejsca na Facebook, Instagram, TikTok, YouTube i Discord są już gotowe. Pokażemy je od razu po podpięciu live linków.",
      backToTop: "Wróć na górę",
    },
    survey: {
      heading: "Ankieta early access",
      subheading:
        "6 krótkich kroków. Bez lania wody, tylko to jak Twój zespół naprawdę pracuje dziś.",
      stepLabel: "Krok",
      progressLabel: "Aktywny krok",
      next: "Dalej",
      back: "Wstecz",
      submit: "Dołącz do early access",
      saving: "Postęp zapisuje się lokalnie",
      rewardBadge: "1 miesiąc Basic za darmo",
      successTitle: "Dzięki za pomoc w kształtowaniu OWO CRM.",
      successBody:
        "Jesteś na liście early access. Zarezerwowaliśmy dla Ciebie 1 miesiąc planu Basic za udział.",
      successHelper:
        "Pierwsza fala wejścia otworzy się w Telegram Mini App, a Telegram pozostaje najszybszym sposobem kontaktu z nami.",
      developerContact: "Telegram do developera",
      submitError:
        "Nie udało się zapisać zgłoszenia. Spróbuj ponownie za chwilę.",
      required: "Uzupełnij bieżący krok, zanim przejdziesz dalej.",
      privacy:
        "Użyjemy Twoich odpowiedzi tylko do oceny dopasowania, budowania produktu i kontaktu w sprawie early access.",
      steps: [
        {
          title: "Profil biznesu",
          description:
            "Powiedz, jaki biznes prowadzisz i jak duży jest zespół dotykający leadów oraz operacji.",
        },
        {
          title: "Obecny ból",
          description:
            "Pokaż nam, gdzie dziś pojawia się chaos, tarcie albo utrata czasu.",
        },
        {
          title: "Priorytety workflow",
          description:
            "Które workflow mają największe znaczenie i gdzie produkt powinien skupić się najpierw?",
        },
        {
          title: "Preferencje produktu",
          description:
            "Jak powinno wyglądać idealne miejsce pracy i co ma pokazywać domyślnie?",
        },
        {
          title: "Sygnał komercyjny",
          description:
            "Pomóż nam zrozumieć, jaką wartość miałby taki produkt w praktyce.",
        },
        {
          title: "Kontakt",
          description:
            "Zostaw dane, żebyśmy mogli odezwać się, gdy ruszy early access.",
        },
      ],
      fields: {
        businessType: {
          label: "Jaki rodzaj biznesu prowadzisz?",
          placeholder: "Wybierz najbliższy typ",
          options: [
            { value: "services", label: "Biznes usługowy" },
            { value: "studio", label: "Studio / rezerwacje" },
            { value: "agency", label: "Agencja / zespół kreatywny" },
            { value: "sales", label: "Zespół sprzedaży oparty na leadach" },
            { value: "other", label: "Inny mały biznes" },
          ],
        },
        teamSize: {
          label: "Jak duży jest zespół pracujący z leadami i operacją?",
          placeholder: "Wybierz wielkość zespołu",
          options: [
            { value: "solo", label: "Tylko ja" },
            { value: "2_5", label: "2-5 osób" },
            { value: "6_15", label: "6-15 osób" },
            { value: "16_plus", label: "16+ osób" },
          ],
        },
        currentTools: {
          label: "Jak dziś zarządzasz leadami i operacją?",
          placeholder:
            "Napisz, z czego korzystasz teraz. Arkusze, Telegram, Notion, notatki, obecny CRM, email - wszystko, co ma znaczenie.",
        },
        mainPains: {
          label: "Co psuje się najczęściej?",
          placeholder:
            "Opisz, co jest chaotyczne, zbyt ręczne, wolne albo łatwe do zgubienia.",
        },
        featurePriorities: {
          label: "Co jest dziś najważniejsze?",
          options: [
            { value: "leads", label: "Leady i pipeline" },
            { value: "tasks", label: "Zadania i follow-up" },
            { value: "communication", label: "Historia komunikacji" },
            { value: "notifications", label: "Powiadomienia" },
            { value: "stats", label: "Statystyki i widoczność" },
            { value: "automation", label: "Automatyzacja" },
          ],
        },
        preferredWorkspace: {
          label: "Gdzie najczęściej używałbyś takiego produktu?",
          options: [
            { value: "desktop_first", label: "Głównie desktop / laptop" },
            { value: "balanced", label: "Desktop i mobile po równo" },
            { value: "mobile_first", label: "Głównie mobile" },
          ],
        },
        idealLeadCardNotes: {
          label: "Co powinno być najłatwiejsze do zobaczenia w widoku leada?",
          placeholder: "Wybierz najważniejszy punkt startowy",
          options: [
            { value: "status_owner", label: "Status, owner i priorytet leada" },
            { value: "next_action", label: "Następny ruch i pilność follow-upu" },
            { value: "communication", label: "Ostatnia komunikacja i notatki" },
            { value: "money", label: "Wartość deala, pipeline i kontekst przychodu" },
          ],
        },
        preferredStyle: {
          label: "Jaki interfejs pracuje się najlepiej?",
          placeholder: "Wybierz najbliższy styl",
          options: [
            { value: "minimal_calm", label: "Minimalny i spokojny" },
            { value: "dense_operational", label: "Gęsty i operacyjny" },
            { value: "premium_dark", label: "Premium dark" },
            { value: "light_clean", label: "Jasny i czysty" },
          ],
        },
        willingnessToPay: {
          label: "Ile realnie zapłaciłbyś, gdyby to rozwiązało Twój workflow?",
          placeholder: "Wybierz przedział",
          options: [
            { value: "under_20", label: "Poniżej $20 / miesiąc" },
            { value: "20_49", label: "$20-49 / miesiąc" },
            { value: "50_99", label: "$50-99 / miesiąc" },
            { value: "100_plus", label: "$100+ / miesiąc" },
          ],
        },
        earlyAccessInterest: {
          label: "Jeśli zaprosimy Cię wcześniej, czy wejdziesz?",
          options: [
            { value: "yes", label: "Tak, zdecydowanie" },
            { value: "maybe", label: "Może, jeśli workflow będzie pasował" },
            { value: "not_now", label: "Na ten moment nie" },
          ],
        },
        name: {
          label: "Imię",
          placeholder: "Twoje imię",
        },
        email: {
          label: "Email",
          placeholder: "ty@firma.com",
        },
        telegram: {
          label: "Telegram",
          placeholder: "@handle albo telefon",
        },
        preferredContact: {
          label: "Preferowany kontakt",
          options: [
            { value: "telegram", label: "Telegram" },
            { value: "email", label: "Email" },
          ],
        },
        consent: {
          label:
            "Zgadzam się, aby OWO CRM kontaktowało się ze mną w sprawie early access i feedbacku produktowego.",
        },
      },
    },
  },
} as const;
