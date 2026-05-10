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
  progress: LeadProgressDto;
  created_at: string;
  updated_at: string;
};

export type LeadProgressDto = {
  completed: number;
  total: number;
  percent: number;
};

export type LeadTaskProgressItemDto = {
  id: string;
  title: string;
  note: string | null;
  due_at: string | null;
  done_at: string | null;
  assignee_name: string | null;
  created_by_name: string | null;
  created_at: string;
  activity_type?: "task_created" | "task_completed";
  activity_text?: string;
  activity_at?: string;
};

export type LeadActivityItemDto = {
  id: string;
  type: string;
  text: string;
  actor_name: string | null;
  created_at: string;
  task_id: string | null;
};

export type LeadNoteItemDto = {
  id: string;
  source: "lead_note";
  text: string;
  author_name: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadDetailDto = {
  lead: LeadDto;
  progress: LeadProgressDto;
  tasks: LeadTaskProgressItemDto[];
  latest_activities: LeadActivityItemDto[];
  notes: LeadNoteItemDto[];
};

export type TaskDto = {
  id: string;
  business_id: string;
  lead_uid: string | null;
  lead_name: string | null;
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

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export type Invoice = {
  id: string;
  business_id: string;
  lead_uid: string | null;
  lead_name: string | null;
  customer_name: string | null;
  number: string;
  currency: string;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  total: number;
  paid_amount: number;
  balance: number;
  is_overdue: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  business_id: string;
  invoice_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  paid_at: string;
  method: string;
  reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PnlSeriesPoint = {
  period: string;
  revenue: number;
  expenses: number;
};

export type FinanceKpiSnapshot = {
  revenue: number;
  expenses: number;
  net: number;
  outstanding: number;
};

export type LeadOutcomePoint = {
  period: string;
  won: number;
  lost: number;
};

export type TeamMemberDto = {
  user_id: string;
  display_name: string;
  email: string | null;
  telegram_id: string | null;
  role: "OWNER" | "ADMIN" | "OPERATOR";
  created_at: string;
};

export type StockItemDto = {
  id: string;
  business_id: string;
  sku: string;
  name: string;
  category: string;
  qty: number;
  min_qty: number;
  price: number;
  created_at: string;
  updated_at: string;
};

export type SettingsDto = {
  company_name: string;
  email_address: string | null;
  phone_number: string | null;
  timezone: string;
  language: string;
  notifications: {
    email_alerts: boolean;
    push_alerts: boolean;
    task_reminders: boolean;
  };
  security: {
    two_factor: boolean;
    session_timeout: string;
  };
  appearance: {
    theme_mode: string;
    density: string;
  };
  updated_at: string;
};

export type AutomationTriggerType =
  | "lead.created"
  | "lead.updated"
  | "lead.note.created"
  | "lead.note.updated"
  | "lead.note.deleted"
  | "task.created"
  | "task.done";

export type AutomationActionType =
  | "assign_owner"
  | "create_follow_up_task"
  | "send_team_alert_email"
  | "send_client_auto_reply_email";

export type AutomationActionDto = {
  type: AutomationActionType;
  policy?: "round_robin" | "fixed_owner";
  fixed_owner_id?: string | null;
};

export type AutomationScenarioConditionsDto = {
  only_if_unassigned?: boolean;
  only_if_lead_has_email?: boolean;
  only_if_status_changed?: boolean;
};

export type AutomationScenarioConfigDto = {
  conditions?: AutomationScenarioConditionsDto;
  actions: AutomationActionDto[];
  state?: {
    round_robin_cursor?: number;
  };
};

export type AutomationScenarioDto = {
  id: string;
  business_id: string;
  key: string;
  name: string;
  trigger_type: AutomationTriggerType;
  is_active: boolean;
  config: AutomationScenarioConfigDto;
  created_at: string;
  updated_at: string;
  last_run: AutomationRunDto | null;
};

export type AutomationRunDto = {
  id: string;
  business_id: string;
  scenario_id: string;
  event_type: string;
  lead_uid: string | null;
  run_key: string;
  status: "succeeded" | "failed" | "skipped";
  error: string | null;
  created_at: string;
};

export type AutomationTestRunResultDto = {
  scenario_id: string;
  matched: boolean;
  dry_run: true;
  status: "succeeded" | "failed" | "skipped";
  reason: string | null;
  actions_preview: string[];
};
