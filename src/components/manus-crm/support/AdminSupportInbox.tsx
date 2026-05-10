"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import {
  addSupportMessage,
  assignSupportTicket,
  type SupportTicketStatus,
  updateSupportTicketStatus,
} from "./support-store";
import { useSupportState } from "./useSupportState";

const statusOrder: SupportTicketStatus[] = ["open", "in_progress", "resolved"];

export function AdminSupportInbox() {
  const { tickets, messages } = useSupportState();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(tickets[0]?.id ?? null);
  const [reply, setReply] = useState("");
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | "all">("all");

  const filteredTickets = useMemo(
    () =>
      [...tickets]
        .filter((ticket) => (statusFilter === "all" ? true : ticket.status === statusFilter))
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    [tickets, statusFilter],
  );

  const selectedTicket =
    filteredTickets.find((ticket) => ticket.id === selectedTicketId) ?? filteredTickets[0] ?? null;
  const selectedMessages = useMemo(
    () => messages.filter((message) => message.ticketId === selectedTicket?.id),
    [messages, selectedTicket?.id],
  );

  const sendReply = () => {
    if (!selectedTicket || !reply.trim()) return;
    addSupportMessage({
      ticketId: selectedTicket.id,
      authorType: "support",
      authorName: "OWO Support",
      text: reply.trim(),
    });
    setReply("");
  };

  const onReplyKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendReply();
    }
  };

  return (
    <div className="h-[calc(100vh-7.5rem)] overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]">
      <div className="grid h-full grid-cols-1 lg:grid-cols-[320px_1fr]">
        <aside className="border-r border-[var(--app-border)]">
          <div className="border-b border-[var(--app-border)] p-4">
            <h1 className="text-lg font-semibold text-[var(--app-text)]">Support Inbox</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={`rounded-lg px-2.5 py-1.5 text-xs ${statusFilter === "all" ? "bg-[#2D5CFE] text-white" : "bg-[var(--app-muted-surface)] text-[var(--app-muted)]"}`}
              >
                All
              </button>
              {statusOrder.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs ${statusFilter === status ? "bg-[#2D5CFE] text-white" : "bg-[var(--app-muted-surface)] text-[var(--app-muted)]"}`}
                >
                  {status.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[calc(100%-108px)] overflow-y-auto p-2">
            {filteredTickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicketId(ticket.id)}
                className={`mb-2 w-full rounded-xl border p-3 text-left ${
                  selectedTicket?.id === ticket.id
                    ? "border-[#2D5CFE] bg-[#2D5CFE]/10"
                    : "border-[var(--app-border)] bg-[var(--app-surface)] hover:bg-[var(--app-muted-surface)]"
                }`}
              >
                <p className="text-sm font-semibold text-[var(--app-text)]">{ticket.title}</p>
                <p className="mt-1 text-xs text-[var(--app-muted)]">{ticket.userName}</p>
                <p className="mt-1 text-xs text-[var(--app-muted)]">{ticket.status.replace("_", " ")}</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex h-full flex-col">
          {selectedTicket ? (
            <>
              <div className="flex items-center justify-between border-b border-[var(--app-border)] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--app-text)]">{selectedTicket.title}</p>
                  <p className="text-xs text-[var(--app-muted)]">
                    {selectedTicket.userName} {selectedTicket.userEmail ? `• ${selectedTicket.userEmail}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => assignSupportTicket(selectedTicket.id, "OWO Support")}
                    className="rounded-lg border border-[var(--app-border)] px-2.5 py-1.5 text-xs text-[var(--app-text)] hover:bg-[var(--app-muted-surface)]"
                  >
                    Assign to me
                  </button>
                  <button
                    onClick={() => updateSupportTicketStatus(selectedTicket.id, "in_progress")}
                    className="rounded-lg border border-[var(--app-border)] px-2.5 py-1.5 text-xs text-[var(--app-text)] hover:bg-[var(--app-muted-surface)]"
                  >
                    In progress
                  </button>
                  <button
                    onClick={() => updateSupportTicketStatus(selectedTicket.id, "resolved")}
                    className="rounded-lg bg-[#2D5CFE] px-2.5 py-1.5 text-xs text-white"
                  >
                    Resolve
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {selectedMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                      message.authorType === "support"
                        ? "ml-auto bg-[#2D5CFE] text-white"
                        : "bg-[var(--app-muted-surface)] text-[var(--app-text)]"
                    }`}
                  >
                    <p>{message.text}</p>
                    <p className={`mt-1 text-[10px] ${message.authorType === "support" ? "text-white/80" : "text-[var(--app-muted)]"}`}>
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 border-t border-[var(--app-border)] p-3">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={onReplyKeyDown}
                  placeholder="Reply as support..."
                  className="flex-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]"
                />
                <button onClick={sendReply} className="rounded-lg bg-[#2D5CFE] px-3 py-2 text-white">
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--app-muted)]">
              No support tickets yet.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
