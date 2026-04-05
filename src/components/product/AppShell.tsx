"use client";

import { createContext, useContext, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/IconRegistry";
import { Tooltip } from "@/components/ui/Tooltip";
import type { AppShellNavItem } from "@/components/ui/types";
import { cn } from "@/lib/ui";

export type ProductTabKey = "leads" | "tasks" | "stats" | "settings";

const ProductTabContext = createContext<{
  activeTab: ProductTabKey;
  setActiveTab: (tab: ProductTabKey) => void;
} | null>(null);

const NAV_ITEMS: AppShellNavItem[] = [
  { key: "leads", label: "Leads", icon: ({ className }) => <Icon name="leads" className={className} /> },
  { key: "tasks", label: "Tasks", icon: ({ className }) => <Icon name="tasks" className={className} /> },
  { key: "stats", label: "Stats", icon: ({ className }) => <Icon name="stats" className={className} /> },
  { key: "settings", label: "Settings", icon: ({ className }) => <Icon name="settings" className={className} /> },
];

function resolveInitialTab(pathname: string, tabParam: string | null): ProductTabKey {
  if (pathname.startsWith("/app/tasks")) return "tasks";
  if (pathname.startsWith("/app/stats")) return "stats";
  if (pathname.startsWith("/app/settings")) return "settings";

  if (tabParam === "tasks") return "tasks";
  if (tabParam === "stats") return "stats";
  if (tabParam === "settings") return "settings";
  if (tabParam === "leads") return "leads";

  return "leads";
}

function updateTabInUrl(tab: ProductTabKey) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (tab === "leads") url.searchParams.delete("tab");
  else url.searchParams.set("tab", tab);
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export function useProductTab() {
  const ctx = useContext(ProductTabContext);
  if (!ctx) throw new Error("useProductTab must be used inside AppShell");
  return ctx;
}

export function AppShell({
  businessName,
  children,
}: {
  businessName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTabState] = useState<ProductTabKey>(() =>
    resolveInitialTab(pathname, searchParams.get("tab")),
  );

  const setActiveTab = (tab: ProductTabKey) => {
    setActiveTabState(tab);
    updateTabInUrl(tab);
  };

  const contextValue = useMemo(() => ({ activeTab, setActiveTab }), [activeTab]);

  return (
    <ProductTabContext.Provider value={contextValue}>
      <div className="relative min-h-screen overflow-hidden bg-[#eef3ff] text-slate-900">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(58% 44% at 8% 6%, rgba(107,127,240,0.2) 0%, transparent 70%), radial-gradient(52% 40% at 92% 5%, rgba(107,127,240,0.16) 0%, transparent 72%)",
          }}
        />

        <div className="relative flex min-h-screen flex-col lg:flex-row">
          <aside className="border-b border-[#cfd8f3] bg-white/95 px-4 py-3 backdrop-blur-md lg:sticky lg:top-0 lg:h-screen lg:w-[240px] lg:border-b-0 lg:border-r lg:border-[#d5def8] lg:px-4 lg:py-5">
            <Link href="/" className="block rounded-lg px-1 py-1 transition hover:bg-[#edf2ff]">
              <p className="text-xs uppercase tracking-[0.18em] text-[#5f73cf]">OWO CRM</p>
              <p className="mt-1 truncate text-sm font-medium text-slate-900">{businessName}</p>
            </Link>

            <nav className="mt-4 hidden lg:-mx-4 lg:grid lg:grid-cols-1">
              {NAV_ITEMS.map((item) => {
                const active = activeTab === item.key;
                const NavIcon = item.icon;

                return (
                  <Tooltip key={item.key} content={item.label}>
                    <button
                      type="button"
                      onClick={() => setActiveTab(item.key)}
                      className={cn(
                        "relative flex min-h-[60px] w-full items-center gap-2 px-4 text-left text-sm transition-colors",
                        active
                          ? "bg-[linear-gradient(90deg,rgba(107,127,240,0.18)_0%,rgba(107,127,240,0.08)_100%)] text-[#1d2c63]"
                          : "text-slate-600 hover:bg-[#eef2ff] hover:text-slate-900",
                      )}
                    >
                      {active ? (
                        <span className="absolute left-0 top-0 h-full w-[2px] bg-[#6b7ff0]" />
                      ) : null}
                      <NavIcon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-[#4f67e8]" : "text-slate-500")} />
                      <span>{item.label}</span>
                    </button>
                  </Tooltip>
                );
              })}
            </nav>
          </aside>

          <div className="flex-1">
            <main className="relative z-10 px-3 py-3 pb-[calc(104px+env(safe-area-inset-bottom))] min-[390px]:px-4 min-[390px]:py-4 sm:px-6 sm:py-5 sm:pb-28 lg:pb-6">{children}</main>
          </div>
        </div>

        <nav className="fixed inset-x-2 bottom-[max(8px,env(safe-area-inset-bottom))] z-30 rounded-2xl border border-[#d4ddf7] bg-white/96 p-1.5 shadow-[0_16px_36px_rgba(46,69,153,0.18)] backdrop-blur-md min-[390px]:inset-x-3 min-[390px]:bottom-3 lg:hidden">
          <ul className="grid grid-cols-4 gap-1">
            {NAV_ITEMS.map((item) => {
              const active = activeTab === item.key;
              const NavIcon = item.icon;

              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(item.key)}
                    className={cn(
                      "flex min-h-[56px] w-full flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors",
                      active
                        ? "bg-[linear-gradient(135deg,rgba(107,127,240,0.22)_0%,rgba(107,127,240,0.14)_100%)] text-[#1d2c63]"
                        : "text-slate-500 hover:bg-[#edf2ff] hover:text-slate-900",
                    )}
                    aria-label={item.label}
                  >
                    <NavIcon className={cn("h-4 w-4", active ? "text-[#4f67e8]" : "text-slate-500")} />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </ProductTabContext.Provider>
  );
}
