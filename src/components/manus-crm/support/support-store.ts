"use client";

export type SupportTicketStatus = "open" | "in_progress" | "resolved";

export type SupportMessage = {
  id: string;
  ticketId: string;
  authorType: "user" | "support";
  authorName: string;
  text: string;
  createdAt: string;
};

export type SupportTicket = {
  id: string;
  businessId: string;
  userName: string;
  userEmail?: string;
  title: string;
  category: "bug" | "question" | "feature";
  status: SupportTicketStatus;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  contextPage?: string;
};

type SupportState = {
  tickets: SupportTicket[];
  messages: SupportMessage[];
};

const STORAGE_KEY = "owocrm-support-state-v1";
const EVENT_NAME = "owocrm-support-updated";
const CHANNEL_NAME = "owocrm-support-channel";

const initialState: SupportState = {
  tickets: [
    {
      id: "t_001",
      businessId: "demo-business",
      userName: "Julia Wisniewska",
      userEmail: "julia@example.com",
      title: "Need help with lead source setup",
      category: "question",
      status: "open",
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      contextPage: "/app/leads",
    },
  ],
  messages: [
    {
      id: "m_001",
      ticketId: "t_001",
      authorType: "user",
      authorName: "Julia Wisniewska",
      text: "Hi team, where can I connect website form source?",
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
  ],
};

let cachedState: SupportState | null = null;

function safeParse(raw: string | null): SupportState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SupportState;
    if (!Array.isArray(parsed.tickets) || !Array.isArray(parsed.messages)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function loadState(): SupportState {
  if (cachedState) return cachedState;
  if (typeof window === "undefined") {
    cachedState = initialState;
    return cachedState;
  }
  const parsed = safeParse(window.localStorage.getItem(STORAGE_KEY));
  if (parsed) {
    cachedState = parsed;
    return cachedState;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
  cachedState = initialState;
  return cachedState;
}

function saveState(next: SupportState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function emitUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT_NAME));
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: "support_updated" });
    channel.close();
  } catch {}
}

function mutate(mutator: (state: SupportState) => SupportState) {
  const current = loadState();
  const next = mutator(current);
  cachedState = next;
  saveState(next);
  emitUpdate();
}

export function getSupportState() {
  return loadState();
}

export function getSupportServerSnapshot() {
  return initialState;
}

export function subscribeSupportState(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const onEvent = () => onChange();
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      const parsed = safeParse(event.newValue);
      if (parsed) cachedState = parsed;
      onChange();
    }
  };
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = () => onChange();
  } catch {}

  window.addEventListener(EVENT_NAME, onEvent);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT_NAME, onEvent);
    window.removeEventListener("storage", onStorage);
    channel?.close();
  };
}

export function createSupportTicket(input: {
  title: string;
  text: string;
  category: SupportTicket["category"];
  userName: string;
  userEmail?: string;
  businessId?: string;
  contextPage?: string;
}) {
  const now = new Date().toISOString();
  const ticketId = `t_${Date.now()}`;
  const messageId = `m_${Date.now()}_1`;
  mutate((state) => ({
    tickets: [
      {
        id: ticketId,
        businessId: input.businessId ?? "demo-business",
        userName: input.userName,
        userEmail: input.userEmail,
        title: input.title,
        category: input.category,
        status: "open",
        createdAt: now,
        updatedAt: now,
        contextPage: input.contextPage,
      },
      ...state.tickets,
    ],
    messages: [
      ...state.messages,
      {
        id: messageId,
        ticketId,
        authorType: "user",
        authorName: input.userName,
        text: input.text,
        createdAt: now,
      },
    ],
  }));
  return ticketId;
}

export function addSupportMessage(input: {
  ticketId: string;
  authorType: SupportMessage["authorType"];
  authorName: string;
  text: string;
}) {
  const now = new Date().toISOString();
  mutate((state) => ({
    tickets: state.tickets.map((ticket) =>
      ticket.id === input.ticketId ? { ...ticket, updatedAt: now } : ticket,
    ),
    messages: [
      ...state.messages,
      {
        id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        ticketId: input.ticketId,
        authorType: input.authorType,
        authorName: input.authorName,
        text: input.text,
        createdAt: now,
      },
    ],
  }));
}

export function updateSupportTicketStatus(ticketId: string, status: SupportTicketStatus) {
  const now = new Date().toISOString();
  mutate((state) => ({
    ...state,
    tickets: state.tickets.map((ticket) =>
      ticket.id === ticketId ? { ...ticket, status, updatedAt: now } : ticket,
    ),
  }));
}

export function assignSupportTicket(ticketId: string, assignee: string) {
  const now = new Date().toISOString();
  mutate((state) => ({
    ...state,
    tickets: state.tickets.map((ticket) =>
      ticket.id === ticketId ? { ...ticket, assignedTo: assignee, status: "in_progress", updatedAt: now } : ticket,
    ),
  }));
}
