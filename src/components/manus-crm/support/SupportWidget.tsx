"use client";

import Link from "next/link";
import { MessageCircle, Send, X } from "lucide-react";
import { useMemo, useState, type KeyboardEvent } from "react";
import { addSupportMessage, createSupportTicket } from "./support-store";
import { useSupportState } from "./useSupportState";

export function SupportWidget() {
  const { tickets, messages } = useSupportState();
  const [open, setOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("Need help");
  const [draftText, setDraftText] = useState("");
  const [category, setCategory] = useState<"bug" | "question" | "feature">("question");
  const [activeTicketId, setActiveTicketId] = useState<string | null>(tickets[0]?.id ?? null);

  const activeTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === activeTicketId) ?? tickets[0] ?? null,
    [tickets, activeTicketId],
  );
  const activeMessages = useMemo(
    () => messages.filter((message) => message.ticketId === activeTicket?.id),
    [messages, activeTicket?.id],
  );

  const submitNew = () => {
    if (!draftText.trim()) return;
    const id = createSupportTicket({
      title: draftTitle.trim() || "Support request",
      text: draftText.trim(),
      category,
      userName: "CRM User",
      businessId: "demo-business",
      contextPage: typeof window !== "undefined" ? window.location.pathname : "/app",
    });
    setActiveTicketId(id);
    setDraftText("");
    setDraftTitle("Need help");
  };

  const sendMessage = () => {
    if (!activeTicket || !draftText.trim()) return;
    addSupportMessage({
      ticketId: activeTicket.id,
      authorType: "user",
      authorName: "CRM User",
      text: draftText.trim(),
    });
    setDraftText("");
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (activeTicket) {
        sendMessage();
      } else {
        submitNew();
      }
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-[#2D5CFE] px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#244ee2]"
      >
        <MessageCircle size={16} />
        Support
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 z-40 w-[360px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[var(--app-border)] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[var(--app-text)]">Support chat</p>
              <p className="text-xs text-[var(--app-muted)]">{tickets.length} tickets</p>
            </div>
            <button className="rounded-lg p-1 text-[var(--app-muted)] hover:bg-[var(--app-muted-surface)]" onClick={() => setOpen(false)}>
              <X size={16} />
            </button>
          </div>

          <div className="max-h-[52vh] space-y-3 overflow-y-auto p-4">
            {activeTicket ? (
              <>
                <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-muted-surface)] p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--app-muted)]">{activeTicket.category}</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--app-text)]">{activeTicket.title}</p>
                  <p className="mt-1 text-xs text-[var(--app-muted)]">status: {activeTicket.status.replace("_", " ")}</p>
                </div>
                {activeMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                      message.authorType === "user"
                        ? "ml-auto bg-[#2D5CFE] text-white"
                        : "bg-[var(--app-muted-surface)] text-[var(--app-text)]"
                    }`}
                  >
                    {message.text}
                  </div>
                ))}
              </>
            ) : (
              <p className="text-sm text-[var(--app-muted)]">Create your first support ticket.</p>
            )}
          </div>

          <div className="space-y-2 border-t border-[var(--app-border)] p-3">
            {!activeTicket && (
              <>
                <input
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]"
                  placeholder="Ticket title"
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as "bug" | "question" | "feature")}
                  className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]"
                >
                  <option value="question">Question</option>
                  <option value="bug">Bug</option>
                  <option value="feature">Feature request</option>
                </select>
              </>
            )}

            <div className="flex gap-2">
              <input
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                onKeyDown={onInputKeyDown}
                className="flex-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]"
                placeholder={activeTicket ? "Write a message..." : "Describe your issue..."}
              />
              <button
                onClick={activeTicket ? sendMessage : submitNew}
                className="rounded-lg bg-[#2D5CFE] px-3 py-2 text-white hover:bg-[#244ee2]"
              >
                <Send size={16} />
              </button>
            </div>
            <Link href="/admin/support" className="block text-center text-xs text-[var(--app-muted)] hover:text-[var(--app-text)]">
              Open support inbox
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
