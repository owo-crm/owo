import type { Locale } from "@/lib/i18n";

export type SurveyUiFieldKey =
  | "businessType"
  | "teamSize"
  | "mainPain"
  | "currentToolStack"
  | "primaryPriority"
  | "preferredWorkspace"
  | "willingnessToPay"
  | "earlyAccessInterest"
  | "acquisitionChannel"
  | "acquisitionOtherText"
  | "name"
  | "email"
  | "telegram"
  | "preferredContact"
  | "consent";

type Option = { value: string; label: string };

type FieldDefinition =
  | {
      type: "input";
      label: string;
      placeholder: string;
      inputType?: "text" | "email";
    }
  | {
      type: "select";
      label: string;
      placeholder: string;
      options: Option[];
    };

export type SurveyStepConfig = {
  id: "profile" | "pain" | "priority" | "source" | "contact";
  fields: SurveyUiFieldKey[];
  requiredFields?: SurveyUiFieldKey[];
};

export type SurveyFormConfig = {
  steps: SurveyStepConfig[];
  fieldDefinitions: Record<Exclude<SurveyUiFieldKey, "consent">, FieldDefinition>;
};

function getSteps(): SurveyStepConfig[] {
  return [
    {
      id: "profile",
      fields: ["businessType", "teamSize"],
    },
    {
      id: "pain",
      fields: ["mainPain", "currentToolStack"],
    },
    {
      id: "priority",
      fields: [
        "primaryPriority",
        "preferredWorkspace",
        "willingnessToPay",
        "earlyAccessInterest",
      ],
    },
    {
      id: "source",
      fields: ["acquisitionChannel", "acquisitionOtherText"],
      requiredFields: ["acquisitionChannel", "acquisitionOtherText"],
    },
    {
      id: "contact",
      fields: ["name", "email", "telegram", "preferredContact", "consent"],
      requiredFields: ["name", "email", "preferredContact", "consent"],
    },
  ];
}

function getOptions(locale: Locale) {
  if (locale === "pl") {
    return {
      businessType: [
        { value: "agency", label: "Agencja / consulting" },
        { value: "services", label: "Uslugi / studio / specjalista" },
        { value: "sales_team", label: "Maly zespol sprzedazy" },
        { value: "freelance_team", label: "Zespol freelance" },
      ],
      teamSize: [
        { value: "solo", label: "1 osoba" },
        { value: "2_5", label: "2-5 osob" },
        { value: "6_15", label: "6-15 osob" },
        { value: "16_plus", label: "16+ osob" },
      ],
      mainPain: [
        { value: "lost_leads", label: "Leady gubia sie w procesie" },
        { value: "slow_first_response", label: "Za wolny pierwszy kontakt" },
        { value: "poor_visibility", label: "Brak przejrzystosci dla zespolu" },
        { value: "manual_updates", label: "Za duzo recznych aktualizacji" },
      ],
      currentToolStack: [
        { value: "google_sheets", label: "Google Sheets" },
        { value: "crm_basic", label: "Prosty CRM" },
        { value: "mix_tools", label: "Mix narzedzi (sheet + chat + email)" },
        { value: "no_system", label: "Brak stalego systemu" },
      ],
      primaryPriority: [
        { value: "sheet_sync", label: "Synchronizacja leadow z source" },
        { value: "auto_first_contact", label: "Automatyczny pierwszy kontakt" },
        { value: "pipeline_visibility", label: "Widocznosc pipeline i ownera" },
        { value: "task_control", label: "Taski i follow-up bez chaosu" },
      ],
      preferredWorkspace: [
        { value: "browser", label: "Web (browser)" },
        { value: "telegram", label: "Telegram Mini App" },
        { value: "both", label: "Oba" },
      ],
      willingnessToPay: [
        { value: "0_20", label: "EUR 0-20 / miesiac" },
        { value: "20_50", label: "EUR 20-50 / miesiac" },
        { value: "50_100", label: "EUR 50-100 / miesiac" },
        { value: "100_plus", label: "EUR 100+ / miesiac" },
      ],
      earlyAccessInterest: [
        { value: "asap", label: "Gotowy od razu" },
        { value: "after_demo", label: "Po krotkim demo" },
        { value: "updates_only", label: "Na razie tylko aktualizacje" },
      ],
      acquisitionChannel: [
        { value: "youtube", label: "YouTube" },
        { value: "tiktok", label: "TikTok" },
        { value: "instagram_facebook", label: "Instagram/Facebook" },
        { value: "google_search", label: "Google Search" },
        { value: "other", label: "Swoj kanal" },
      ],
      preferredContact: [
        { value: "email", label: "Email" },
        { value: "telegram", label: "Telegram" },
      ],
    };
  }

  return {
    businessType: [
      { value: "agency", label: "Agency / consulting" },
      { value: "services", label: "Services / studio / specialist" },
      { value: "sales_team", label: "Small sales team" },
      { value: "freelance_team", label: "Freelance team" },
    ],
    teamSize: [
      { value: "solo", label: "1 person" },
      { value: "2_5", label: "2-5 people" },
      { value: "6_15", label: "6-15 people" },
      { value: "16_plus", label: "16+ people" },
    ],
    mainPain: [
      { value: "lost_leads", label: "Leads get lost in the process" },
      { value: "slow_first_response", label: "First contact is too slow" },
      { value: "poor_visibility", label: "Poor team visibility" },
      { value: "manual_updates", label: "Too many manual updates" },
    ],
    currentToolStack: [
      { value: "google_sheets", label: "Google Sheets" },
      { value: "crm_basic", label: "Basic CRM" },
      { value: "mix_tools", label: "Mixed tools (sheet + chat + email)" },
      { value: "no_system", label: "No stable system yet" },
    ],
    primaryPriority: [
      { value: "sheet_sync", label: "Lead sync from source" },
      { value: "auto_first_contact", label: "Automatic first contact" },
      { value: "pipeline_visibility", label: "Pipeline and owner visibility" },
      { value: "task_control", label: "Task and follow-up control" },
    ],
    preferredWorkspace: [
      { value: "browser", label: "Web (browser)" },
      { value: "telegram", label: "Telegram Mini App" },
      { value: "both", label: "Both" },
    ],
    willingnessToPay: [
      { value: "0_20", label: "EUR 0-20 / month" },
      { value: "20_50", label: "EUR 20-50 / month" },
      { value: "50_100", label: "EUR 50-100 / month" },
      { value: "100_plus", label: "EUR 100+ / month" },
    ],
    earlyAccessInterest: [
      { value: "asap", label: "Ready now" },
      { value: "after_demo", label: "After short demo" },
      { value: "updates_only", label: "Updates only for now" },
    ],
    acquisitionChannel: [
      { value: "youtube", label: "YouTube" },
      { value: "tiktok", label: "TikTok" },
      { value: "instagram_facebook", label: "Instagram/Facebook" },
      { value: "google_search", label: "Google Search" },
      { value: "other", label: "Other" },
    ],
    preferredContact: [
      { value: "email", label: "Email" },
      { value: "telegram", label: "Telegram" },
    ],
  };
}

export function getSurveyFormConfig(locale: Locale): SurveyFormConfig {
  const options = getOptions(locale);

  if (locale === "pl") {
    return {
      steps: getSteps(),
      fieldDefinitions: {
        businessType: {
          type: "select",
          label: "Jaki rodzaj biznesu prowadzisz?",
          placeholder: "Wybierz opcje",
          options: options.businessType,
        },
        teamSize: {
          type: "select",
          label: "Jak duzy jest zespol pracujacy z leadami?",
          placeholder: "Wybierz wielkosc zespolu",
          options: options.teamSize,
        },
        mainPain: {
          type: "select",
          label: "Co jest najwiekszym problemem teraz?",
          placeholder: "Wybierz najwiekszy problem",
          options: options.mainPain,
        },
        currentToolStack: {
          type: "select",
          label: "Na czym obecnie prowadzisz leady?",
          placeholder: "Wybierz aktualny stack",
          options: options.currentToolStack,
        },
        primaryPriority: {
          type: "select",
          label: "Jaki jest glowny priorytet wdrozenia?",
          placeholder: "Wybierz priorytet",
          options: options.primaryPriority,
        },
        preferredWorkspace: {
          type: "select",
          label: "Gdzie chcesz glownie pracowac?",
          placeholder: "Wybierz workspace",
          options: options.preferredWorkspace,
        },
        willingnessToPay: {
          type: "select",
          label: "Akceptowalny budzet miesieczny",
          placeholder: "Wybierz zakres",
          options: options.willingnessToPay,
        },
        earlyAccessInterest: {
          type: "select",
          label: "Gotowosc do wejscia w early access",
          placeholder: "Wybierz opcje",
          options: options.earlyAccessInterest,
        },
        acquisitionChannel: {
          type: "select",
          label: "Skad dowiedziales sie o nas?",
          placeholder: "Wybierz kanal",
          options: options.acquisitionChannel,
        },
        acquisitionOtherText: {
          type: "input",
          label: "Jaki kanal?",
          placeholder: "Napisz skad trafiles",
        },
        name: {
          type: "input",
          label: "Imie",
          placeholder: "Twoje imie",
        },
        email: {
          type: "input",
          inputType: "email",
          label: "Email",
          placeholder: "name@company.com",
        },
        telegram: {
          type: "input",
          label: "Telegram (opcjonalnie)",
          placeholder: "@username",
        },
        preferredContact: {
          type: "select",
          label: "Preferowany kanal kontaktu",
          placeholder: "Wybierz kanal",
          options: options.preferredContact,
        },
      },
    };
  }

  return {
    steps: getSteps(),
    fieldDefinitions: {
      businessType: {
        type: "select",
        label: "What type of business do you run?",
        placeholder: "Select option",
        options: options.businessType,
      },
      teamSize: {
        type: "select",
        label: "How big is your lead-handling team?",
        placeholder: "Select team size",
        options: options.teamSize,
      },
      mainPain: {
        type: "select",
        label: "What is your biggest pain right now?",
        placeholder: "Select primary pain",
        options: options.mainPain,
      },
      currentToolStack: {
        type: "select",
        label: "What do you use to run leads today?",
        placeholder: "Select current setup",
        options: options.currentToolStack,
      },
      primaryPriority: {
        type: "select",
        label: "What is your top implementation priority?",
        placeholder: "Select priority",
        options: options.primaryPriority,
      },
      preferredWorkspace: {
        type: "select",
        label: "Where do you prefer to work?",
        placeholder: "Select workspace",
        options: options.preferredWorkspace,
      },
      willingnessToPay: {
        type: "select",
        label: "Comfortable monthly budget",
        placeholder: "Select range",
        options: options.willingnessToPay,
      },
      earlyAccessInterest: {
        type: "select",
        label: "Early access readiness",
        placeholder: "Select option",
        options: options.earlyAccessInterest,
      },
      acquisitionChannel: {
        type: "select",
        label: "Where did you hear about us?",
        placeholder: "Select channel",
        options: options.acquisitionChannel,
      },
      acquisitionOtherText: {
        type: "input",
        label: "Which channel?",
        placeholder: "Type channel/source",
      },
      name: {
        type: "input",
        label: "Name",
        placeholder: "Your name",
      },
      email: {
        type: "input",
        inputType: "email",
        label: "Email",
        placeholder: "name@company.com",
      },
      telegram: {
        type: "input",
        label: "Telegram (optional)",
        placeholder: "@username",
      },
      preferredContact: {
        type: "select",
        label: "Preferred contact channel",
        placeholder: "Select channel",
        options: options.preferredContact,
      },
    },
  };
}
