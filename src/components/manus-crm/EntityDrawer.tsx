"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

type EntityDrawerProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClassName?: string;
  customHeader?: React.ReactNode;
  contentClassName?: string;
};

export function EntityDrawer({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  widthClassName = "w-full max-w-2xl",
  customHeader,
  contentClassName = "min-h-0 flex-1 overflow-auto px-5 py-4",
}: EntityDrawerProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close drawer backdrop"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <section
        className={`absolute inset-y-0 right-0 flex flex-col border-l border-[var(--app-border)] bg-[var(--app-surface)] shadow-2xl ${widthClassName}`}
        role="dialog"
        aria-modal="true"
      >
        {customHeader ? (
          customHeader
        ) : (
          <header className="flex items-start justify-between border-b border-[var(--app-border)] px-5 py-4">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold text-[var(--app-text)]">{title}</h2>
              {subtitle ? <p className="mt-1 text-sm text-[var(--app-muted)]">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-[var(--app-muted)] hover:bg-[var(--app-muted-surface)] hover:text-[var(--app-text)]"
            >
              <X size={18} />
            </button>
          </header>
        )}
        <div className={contentClassName}>{children}</div>
        {footer ? <footer className="border-t border-[var(--app-border)] px-5 py-4">{footer}</footer> : null}
      </section>
    </div>
  );
}
