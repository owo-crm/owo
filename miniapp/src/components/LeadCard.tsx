import type { CSSProperties } from "react";
import type { Lead } from "../api/leads";

type LeadCardProps = {
  lead: Lead;
  onOpen: (uid: string) => void;
  ownerLabel?: string;
  openTaskCount?: number;
  statusTone?: "new" | "warm" | "won";
  statusLabel?: string;
  statusColor?: string;
  workflowHint?: string;
  workflowHintTone?: "warning" | "ok" | "soft";
  nextActionLabel?: string;
  onNextAction?: () => void;
};

const avatarPalette = [
  ["#a855f7", "#7c3aed"],
  ["#ec4899", "#a855f7"],
  ["#3b82f6", "#6366f1"],
  ["#14b8a6", "#22c55e"],
  ["#f59e0b", "#f97316"],
  ["#8b5cf6", "#ec4899"],
  ["#06b6d4", "#3b82f6"],
  ["#84cc16", "#22c55e"],
];

function formatDate(value?: string | null, includeTime = false) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString(
    "en-GB",
    includeTime
      ? {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      : {
          day: "2-digit",
          month: "short",
          year: "numeric",
        },
  );
}

function normalizePhoneForDisplay(value?: string | null) {
  if (!value) {
    return null;
  }

  const digitsOnly = value.replace(/\D+/g, "");
  if (!digitsOnly) {
    return value;
  }

  const normalizedDigits = digitsOnly.startsWith("00") ? digitsOnly.slice(2) : digitsOnly;
  return `+${normalizedDigits}`;
}

function hashString(value: string) {
  return [...value].reduce((accumulator, character) => accumulator + character.charCodeAt(0), 0);
}

function getAvatarStyle(name?: string | null): CSSProperties {
  const palette = avatarPalette[hashString(name?.trim() || "lead") % avatarPalette.length];
  return {
    background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`,
  };
}

function getInitials(name?: string | null) {
  const value = (name ?? "").trim();
  if (!value) {
    return "?";
  }
  const parts = value.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function hexToRgba(hex: string, alpha: number) {
  const sanitized = hex.replace("#", "");
  if (![3, 6].includes(sanitized.length)) {
    return undefined;
  }
  const normalized = sanitized.length === 3
    ? sanitized.split("").map((char) => `${char}${char}`).join("")
    : sanitized;
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function LeadCard({
  lead,
  onOpen,
  ownerLabel,
  openTaskCount = 0,
  statusTone = "new",
  statusLabel,
  statusColor,
  workflowHint,
  workflowHintTone = "warning",
  nextActionLabel,
  onNextAction,
}: LeadCardProps) {
  const phone = normalizePhoneForDisplay(lead.phone);
  const receivedAt = formatDate(lead.created_at) ?? "Unknown";
  const eventDate = formatDate(lead.event_date);
  const owner = ownerLabel ?? (lead.assigned_to ? "Assigned" : "Unassigned");
  const resolvedStatusLabel = statusLabel ?? lead.status.replace(/_/g, " ");
  const statusStyles = statusColor
    ? {
        color: statusColor,
        backgroundColor: hexToRgba(statusColor, 0.14),
        borderColor: hexToRgba(statusColor, 0.28),
      }
    : undefined;

  return (
    <article className="lead-list-card">
      <div className="lead-list-card__topline">
        <div className="lead-list-card__identity">
          <span className="lead-list-card__avatar" style={getAvatarStyle(lead.name)}>
            {getInitials(lead.name)}
          </span>
          <div className="lead-list-card__copy">
            <strong>{lead.name?.trim() || "Unnamed lead"}</strong>
            <span>{phone ?? (lead.email?.trim() || "No contact provided")}</span>
            <span>
              {eventDate ?? receivedAt}
              {lead.event_type ? ` · ${lead.event_type}` : ""}
            </span>
          </div>
        </div>
        <span
          className={`lead-list-card__status lead-list-card__status--${statusTone}`}
          style={statusStyles}
        >
          {resolvedStatusLabel}
        </span>
      </div>

      <div className="lead-list-card__meta">
        <span>Owner · {owner}</span>
        <span>Tasks · {openTaskCount > 0 ? `${openTaskCount} open` : "None"}</span>
      </div>

      {workflowHint ? (
        <p
          className={`lead-card__workflow-hint${
            workflowHintTone === "ok"
              ? " lead-card__workflow-hint--ok"
              : workflowHintTone === "soft"
                ? " lead-card__workflow-hint--soft"
                : ""
          }`}
        >
          {workflowHint}
        </p>
      ) : null}

      <div className="lead-list-card__actions">
        {nextActionLabel && onNextAction ? (
          <button type="button" className="lead-list-card__quick-action" onClick={onNextAction}>
            {nextActionLabel}
          </button>
        ) : null}
        <button type="button" className="ghost-button" onClick={() => onOpen(lead.uid)}>
          Open
        </button>
      </div>
    </article>
  );
}
