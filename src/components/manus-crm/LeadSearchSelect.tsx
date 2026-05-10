"use client";

import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api/client-session";
import type { LeadDto } from "@/lib/types/domain";

type LeadsResponse = { ok: boolean; leads: LeadDto[] };

type LeadSearchSelectProps = {
  value: string;
  onChange: (leadUid: string, leadLabel?: string) => void;
  selectedLabel?: string | null;
  placeholder?: string;
  className?: string;
};

export function LeadSearchSelect({
  value,
  onChange,
  selectedLabel,
  placeholder = "Search lead by name, phone or email",
  className,
}: LeadSearchSelectProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<LeadDto[]>([]);

  const display = useMemo(() => {
    if (query.trim()) return query;
    return selectedLabel?.trim() || "";
  }, [query, selectedLabel]);

  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "12" });
        if (query.trim()) params.set("search", query.trim());
        const response = await apiFetch(`/api/v1/leads?${params.toString()}`);
        const json = (await response.json()) as LeadsResponse | { ok: false };
        if (response.ok && json.ok) {
          setItems(json.leads);
        } else {
          setItems([]);
        }
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timeout);
  }, [open, query]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current) return;
      const target = event.target as Node;
      if (!rootRef.current.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`.trim()}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 text-[var(--app-muted)]" size={15} />
        <input
          value={display}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] py-2 pl-9 pr-8 text-sm text-[var(--app-text)] outline-none focus:border-[#2D5CFE]"
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear selected lead"
            onClick={() => {
              onChange("", undefined);
              setQuery("");
              setOpen(false);
            }}
            className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-[var(--app-muted)] hover:bg-[var(--app-muted-surface)] hover:text-[var(--app-text)]"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] shadow-lg">
          {loading ? (
            <p className="px-3 py-2 text-xs text-[var(--app-muted)]">Loading leads...</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-2 text-xs text-[var(--app-muted)]">No leads found</p>
          ) : (
            items.map((lead) => (
              <button
                type="button"
                key={lead.id}
                onClick={() => {
                  onChange(lead.uid, lead.full_name);
                  setQuery("");
                  setOpen(false);
                }}
                className="block w-full border-b border-[var(--app-border)] px-3 py-2 text-left last:border-b-0 hover:bg-[var(--app-muted-surface)]"
              >
                <p className="text-sm font-medium text-[var(--app-text)]">{lead.full_name}</p>
                <p className="text-xs text-[var(--app-muted)]">
                  {[lead.email, lead.phone].filter(Boolean).join(" · ") || "No contact"}
                </p>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
