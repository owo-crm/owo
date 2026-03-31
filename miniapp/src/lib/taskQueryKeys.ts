export const taskQueryKeys = {
  root: (businessId: string) => ["tasks", businessId] as const,
  list: (businessId: string, state = "open", assignee = "") => ["tasks", businessId, "list", state, assignee] as const,
  summary: (businessId: string) => ["tasks", businessId, "summary"] as const,
  hints: (businessId: string) => ["tasks", businessId, "lead-list-hints"] as const,
  calendar: (businessId: string) => ["tasks", businessId, "dashboard-calendar"] as const,
};
