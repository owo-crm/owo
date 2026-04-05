type ValueLabels = Record<string, string>;

export const SURVEY_VALUE_LABELS: Record<string, ValueLabels> = {
  businessType: {
    agency: "Agency / consulting",
    services: "Services / studio / specialist",
    sales_team: "Small sales team",
    freelance_team: "Freelance team",
  },
  teamSize: {
    solo: "1 person",
    "2_5": "2-5 people",
    "6_15": "6-15 people",
    "16_plus": "16+ people",
  },
  mainPain: {
    lost_leads: "Leads get lost in process",
    slow_first_response: "First response is too slow",
    poor_visibility: "Poor visibility",
    manual_updates: "Too many manual updates",
  },
  currentToolStack: {
    google_sheets: "Google Sheets",
    crm_basic: "Basic CRM",
    mix_tools: "Mixed tools",
    no_system: "No stable system",
  },
  primaryPriority: {
    sheet_sync: "Lead sync from source",
    auto_first_contact: "Automatic first contact",
    pipeline_visibility: "Pipeline visibility",
    task_control: "Task and follow-up control",
  },
  preferredWorkspace: {
    browser: "Web (browser)",
    telegram: "Telegram Mini App",
    both: "Both",
  },
  willingnessToPay: {
    "0_20": "EUR 0-20 / month",
    "20_50": "EUR 20-50 / month",
    "50_100": "EUR 50-100 / month",
    "100_plus": "EUR 100+ / month",
  },
  earlyAccessInterest: {
    asap: "Ready now",
    after_demo: "After short demo",
    updates_only: "Updates only",
  },
  preferredContact: {
    email: "Email",
    telegram: "Telegram",
  },
  acquisitionChannel: {
    youtube: "YouTube",
    tiktok: "TikTok",
    instagram_facebook: "Instagram/Facebook",
    google_search: "Google Search",
    other: "Other",
    unknown: "Unknown",
  },
  featurePriorities: {
    sheet_sync: "Lead sync from source",
    auto_first_contact: "Automatic first contact",
    pipeline_visibility: "Pipeline visibility",
    task_control: "Task and follow-up control",
  },
};

export function formatSurveyValue(field: string, value: string) {
  if (value === "__empty__") return "(empty)";
  const labels = SURVEY_VALUE_LABELS[field];
  return labels?.[value] ?? value;
}
