"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Menu,
  Moon,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  Settings,
  Sun,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { SupportWidget } from "./support/SupportWidget";

const menuItems = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/leads", label: "Leads", icon: Users },
  { href: "/app/finance", label: "Finance", icon: ReceiptText },
  { href: "/app/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/app/stock", label: "Stock", icon: Package },
  { href: "/app/tasks", label: "Tasks & Team", icon: FileText },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function ManusCrmShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem("owocrm-sidebar-collapsed") === "true";
  });
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    const savedTheme = window.localStorage.getItem("owocrm-app-theme");
    return savedTheme === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    window.localStorage.setItem("owocrm-app-theme", theme);
    window.dispatchEvent(new CustomEvent("owocrm-theme-change", { detail: theme }));
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("owocrm-sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const isDark = theme === "dark";
  const themeVars = {
    "--app-bg": isDark ? "#0f172a" : "#f8fafc",
    "--app-surface": isDark ? "#111827" : "#ffffff",
    "--app-muted-surface": isDark ? "#1f2937" : "#f8fafc",
    "--app-border": isDark ? "#334155" : "#e2e8f0",
    "--app-text": isDark ? "#e2e8f0" : "#0f172a",
    "--app-muted": isDark ? "#94a3b8" : "#64748b",
    "--app-hover-text": isDark ? "#e2e8f0" : "#0f172a",
    "--app-notification-text": isDark ? "#cbd5e1" : "#475569",
    "--app-notification-high-bg": isDark ? "rgba(239,68,68,0.14)" : "#fef2f2",
    "--app-notification-normal-bg": isDark ? "rgba(59,130,246,0.14)" : "#eff6ff",
  } as CSSProperties;

  return (
    <div className="flex h-screen bg-[var(--app-bg)] text-[var(--app-text)]" style={themeVars}>
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[var(--app-surface)] border-r border-[var(--app-border)] transform transition-[width,transform] duration-200 ease-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${sidebarCollapsed ? "lg:w-20" : "w-72"}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[var(--app-border)] px-4 py-4">
            <Link href="/" className="group flex items-center gap-3">
              <div className="h-9 w-9 overflow-hidden rounded-xl border border-[var(--app-border)] bg-black">
                <Image
                  src="/owoweb-logo.png"
                  alt="OWO CRM logo"
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                />
              </div>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  sidebarCollapsed ? "max-w-0 opacity-0" : "max-w-[140px] opacity-100"
                }`}
              >
                <p className="whitespace-nowrap text-sm font-semibold text-[var(--app-text)]">OWO CRM</p>
                <p className="whitespace-nowrap text-xs text-[var(--app-muted)]">Workspace</p>
              </div>
            </Link>
            <button className="lg:hidden text-[var(--app-muted)]" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch
                    className={`flex items-center rounded-xl px-4 py-3 text-sm transition-colors duration-150 ${
                      active
                        ? "bg-[#2D5CFE] !text-white shadow-sm [&_*]:!text-white"
                        : "text-[var(--app-muted)] hover:bg-[var(--app-muted-surface)] hover:text-[var(--app-text)]"
                    } ${sidebarCollapsed ? "lg:justify-center" : "justify-start gap-3"}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span
                      className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-out ${
                        sidebarCollapsed ? "max-w-0 opacity-0" : "max-w-[140px] opacity-100"
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-[var(--app-border)] p-4">
            <p
              className={`overflow-hidden whitespace-nowrap text-xs text-[var(--app-muted)] transition-[max-width,opacity] duration-200 ease-out ${
                sidebarCollapsed ? "max-w-0 opacity-0" : "max-w-[90px] opacity-100"
              }`}
            >
              OWO CRM
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-4 lg:px-6">
          <div className="flex items-center gap-2">
            <button className="lg:hidden text-[var(--app-muted)]" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={22} />
            </button>
            <button
              className="hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-2.5 text-[var(--app-muted)] transition hover:bg-[var(--app-muted-surface)] lg:inline-flex"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setSidebarCollapsed((prev) => !prev)}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          <div className="hidden w-full max-w-md px-4 md:block">
            <input
              type="text"
              placeholder="Search leads, contacts..."
              className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-muted-surface)] px-4 py-2 text-sm text-[var(--app-text)] outline-none ring-0 placeholder:text-[var(--app-muted)] focus:border-[#2D5CFE]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button className="relative rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 text-[var(--app-muted)] transition hover:bg-[var(--app-muted-surface)]">
              <Bell size={20} />
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" />
            </button>
            <button
              className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 text-[var(--app-muted)] transition hover:bg-[var(--app-muted-surface)]"
              onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 text-[var(--app-muted)] transition hover:bg-[var(--app-muted-surface)]">
              <User size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <SupportWidget />
    </div>
  );
}
