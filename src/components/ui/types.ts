export type AppShellNavItem = {
  key: "leads" | "tasks" | "stats" | "settings";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export type KpiCardProps = {
  label: string;
  value: string;
  tone?: "default" | "accent";
};

export type StatusPillProps = {
  label: string;
  tone?: "default" | "success" | "danger" | "muted";
  colorHex?: string | null;
};

export type FormFieldProps = {
  label?: string;
  hint?: string;
  error?: string;
  className?: string;
};

export type IconKey =
  | "leads"
  | "tasks"
  | "stats"
  | "settings"
  | "business"
  | "status"
  | "owner"
  | "source"
  | "nextTask"
  | "sale";
