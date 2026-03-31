export type LeadPreview = {
  id: string;
  name: string;
  phone: string;
  eventType: string;
  eventDate: string;
  value: string;
  assignee: string;
  statusLabel: string;
  statusTone: "new" | "warm" | "won";
};

export const demoLeads: LeadPreview[] = [
  {
    id: "1",
    name: "Monika Sokol",
    phone: "+48 501 220 884",
    eventType: "Wedding",
    eventDate: "12 Jul 2026",
    value: "18 500 PLN",
    assignee: "Adrian",
    statusLabel: "New",
    statusTone: "new",
  },
  {
    id: "2",
    name: "Marek Dolny",
    phone: "+48 692 112 334",
    eventType: "Birthday",
    eventDate: "04 Jun 2026",
    value: "7 200 PLN",
    assignee: "Kasia",
    statusLabel: "Waiting for call",
    statusTone: "warm",
  },
  {
    id: "3",
    name: "Studio D17",
    phone: "+48 730 909 515",
    eventType: "Corporate event",
    eventDate: "28 Aug 2026",
    value: "24 000 PLN",
    assignee: "Bartek",
    statusLabel: "Won",
    statusTone: "won",
  },
];

export const summaryCards = [
  { label: "Total leads", value: "148", trend: "+18 this month" },
  { label: "Won deals", value: "31", trend: "20.9% conversion" },
  { label: "Revenue", value: "286k PLN", trend: "+12.4% vs last month" },
  { label: "Open tasks", value: "9", trend: "3 due today" },
];

export const leadStatuses = [
  { value: "all", label: "All statuses" },
  { value: "new", label: "New lead" },
  { value: "waiting_for_call", label: "Waiting for call" },
  { value: "won", label: "Won" },
  { value: "failed", label: "Failed" },
];

export const teamMembers = [
  { name: "Adrian", role: "Owner" },
  { name: "Kasia", role: "Admin" },
  { name: "Bartek", role: "Member" },
];

export const tasks = [
  { title: "Call Monika after offer", due: "Today, 18:30", owner: "Adrian", urgent: true },
  { title: "Prepare event contract PDF", due: "Tomorrow, 10:00", owner: "Kasia", urgent: false },
  { title: "Verify Facebook lead sync", due: "Fri, 09:00", owner: "Bartek", urgent: false },
];

export const expenses = [
  {
    title: "Studio rent",
    amount: "6 000 PLN",
    type: "Recurring",
    note: "Monthly fixed cost",
  },
  {
    title: "Transport for Monika wedding",
    amount: "480 PLN",
    type: "One-time",
    note: "Assigned to won client",
  },
  {
    title: "Ads manager assistant",
    amount: "2 200 PLN",
    type: "Recurring",
    note: "Monthly contractor retainer",
  },
  {
    title: "Printed sample package",
    amount: "190 PLN",
    type: "One-time",
    note: "Sent after deal confirmation",
  },
];
