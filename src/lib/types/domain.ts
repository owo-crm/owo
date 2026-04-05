export type AuthenticatedUser = {
  id: string;
  telegram_id: string | null;
  email: string | null;
  display_name: string;
  is_platform_admin: boolean;
};

export type BusinessContext = {
  business_id: string;
  business_name: string;
  role: "OWNER" | "ADMIN" | "OPERATOR";
};

export type AuthSessionPayload = {
  sub: string;
  business_id: string;
  role: "OWNER" | "ADMIN" | "OPERATOR";
  exp: number;
  iat: number;
};

export type LeadDto = {
  id: string;
  uid: string;
  business_id: string;
  source:
    | "manual"
    | "google_sheet"
    | "website_form"
    | "api"
    | "meta_form_direct"
    | "import_file";
  full_name: string;
  phone: string | null;
  email: string | null;
  note: string | null;
  metadata: Record<string, unknown> | null;
  owner: {
    id: string;
    display_name: string;
  } | null;
  status: {
    id: string;
    key: string;
    label: string;
    color_hex: string;
  } | null;
  next_task: {
    id: string;
    title: string;
    due_at: string | null;
  } | null;
  created_at: string;
  updated_at: string;
};

export type TaskDto = {
  id: string;
  business_id: string;
  lead_uid: string | null;
  title: string;
  note: string | null;
  due_at: string | null;
  done_at: string | null;
  assignee: {
    id: string;
    display_name: string;
  } | null;
  created_at: string;
  updated_at: string;
};

export type BusinessEventDto = {
  id: string;
  business_id: string;
  type: string;
  actor_user_id: string | null;
  lead_uid: string | null;
  task_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

export type IngestionRequest = {
  full_name?: string;
  phone?: string;
  email?: string;
  note?: string;
  external_id?: string;
  source_created_at?: string;
  metadata?: Record<string, unknown>;
};

export type IngestionResult = {
  accepted: boolean;
  action: "created" | "merged" | "idempotent";
  lead_uid: string;
  warnings: string[];
};

export type SurveySubmissionDto = {
  id: string;
  language: string;
  source: string;
  name: string;
  email: string;
  telegram: string;
  preferred_contact: string;
  consent_to_contact: boolean;
  business_type: string;
  team_size: string;
  current_tools: string;
  main_pains: string;
  feature_priorities: string[];
  preferred_workspace: string;
  ideal_lead_card_notes: string;
  preferred_style: string;
  willingness_to_pay: string;
  early_access_interest: string;
  created_at: string;
};

export type SurveyStatsDto = {
  totals: {
    submissions: number;
    withTelegram: number;
    preferredTelegram: number;
    preferredEmail: number;
  };
  breakdowns: {
    language: Record<string, number>;
    businessType: Record<string, number>;
    teamSize: Record<string, number>;
    preferredWorkspace: Record<string, number>;
    willingnessToPay: Record<string, number>;
    earlyAccessInterest: Record<string, number>;
  };
  comparisons?: Array<{
    fieldKey: string;
    sampleSize: number;
    winner: {
      value: string;
      votes: number;
      share: number;
    } | null;
    runnerUp: {
      value: string;
      votes: number;
      share: number;
    } | null;
    marginVotes: number;
    marginShare: number;
  }>;
  questionBreakdowns: Record<string, Record<string, number>>;
  recent: Array<{
    contact: {
      id: string;
      name: string;
      email: string;
      telegram: string;
      preferredContact: string;
      language: string;
      createdAt: string;
    };
    survey: {
      businessType: string;
      teamSize: string;
      preferredWorkspace: string;
      willingnessToPay: string;
      earlyAccessInterest: string;
    } | null;
  }>;
};
