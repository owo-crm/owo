"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useAppTheme } from "./useAppTheme";

const CALENDAR_BUNDLE_BASE =
  "https://cdn.21st.dev/vaib215/event-manager/default/bundle.1760640393494.html";

export function CalendarPage({ embedded = false }: { embedded?: boolean }) {
  const { theme, isDark } = useAppTheme("light");
  const [srcDoc, setSrcDoc] = useState("");

  const appVars = {
    "--app-bg": isDark ? "#0f172a" : "#f8fafc",
    "--app-surface": isDark ? "#111827" : "#ffffff",
    "--app-border": isDark ? "#334155" : "#e2e8f0",
    "--app-text": isDark ? "#e2e8f0" : "#0f172a",
    "--app-muted": isDark ? "#94a3b8" : "#64748b",
  } as CSSProperties;

  const url = useMemo(
    () =>
      theme === "dark"
        ? `${CALENDAR_BUNDLE_BASE}?theme=dark&dark=true`
        : `${CALENDAR_BUNDLE_BASE}?theme=light&dark=false`,
    [theme],
  );

  useEffect(() => {
    let isCancelled = false;

    const injectTheme = (html: string) => {
      const override = `
<style id="owo-calendar-theme-override">
  :root {
    color-scheme: ${theme};
    --radius: 0.75rem !important;
    --primary: #2D5CFE !important;
    --primary-foreground: 0 0% 100% !important;
    --ring: #2D5CFE !important;
    --sidebar-primary: #2D5CFE !important;
    --chart-1: #2D5CFE !important;
    --chart-2: #4f74ff !important;
    --chart-3: #7c97ff !important;
    --destructive: 0 84% 60% !important;
    --destructive-foreground: 0 0% 100% !important;
    ${
      theme === "dark"
        ? `
    --background: 222 47% 11% !important;
    --foreground: 210 40% 98% !important;
    --card: 222 40% 13% !important;
    --card-foreground: 210 40% 98% !important;
    --popover: 222 40% 13% !important;
    --popover-foreground: 210 40% 98% !important;
    --muted: 217 33% 22% !important;
    --muted-foreground: 215 20% 70% !important;
    --border: 217 33% 24% !important;
    --input: 217 33% 24% !important;
  `
        : `
    --background: 210 40% 98% !important;
    --foreground: 222 47% 11% !important;
    --card: 0 0% 100% !important;
    --card-foreground: 222 47% 11% !important;
    --popover: 0 0% 100% !important;
    --popover-foreground: 222 47% 11% !important;
    --muted: 210 40% 96% !important;
    --muted-foreground: 215 16% 40% !important;
    --border: 214 32% 91% !important;
    --input: 214 32% 91% !important;
  `
    }
  }
  html, body {
    margin: 0 !important;
    background: hsl(var(--background)) !important;
    color: hsl(var(--foreground)) !important;
  }
  html.dark body,
  .dark body {
    background: hsl(var(--background)) !important;
    color: hsl(var(--foreground)) !important;
  }
  .bg-primary,
  .bg-\\[\\#2D5CFE\\],
  .bg-\\[\\#2d5cfe\\],
  [data-state="active"],
  [aria-selected="true"],
  [aria-pressed="true"] {
    background-color: #2D5CFE !important;
    border-color: #2D5CFE !important;
    color: #ffffff !important;
  }
  .bg-primary *,
  .bg-\\[\\#2D5CFE\\] *,
  .bg-\\[\\#2d5cfe\\] *,
  [data-state="active"] *,
  [aria-selected="true"] *,
  [aria-pressed="true"] * {
    color: #ffffff !important;
    fill: #ffffff !important;
    stroke: #ffffff !important;
  }
  .text-white,
  .text-white * {
    color: #ffffff !important;
    fill: #ffffff !important;
    stroke: #ffffff !important;
  }
  .text-primary {
    color: #2D5CFE !important;
  }
  .border-primary {
    border-color: #2D5CFE !important;
  }
  button:hover,
  [role="tab"]:hover {
    color: hsl(var(--foreground)) !important;
  }
</style>`;

      const themeScript = `<script id="owo-calendar-theme-script">(function(){try{var root=document.documentElement;${theme === "dark" ? "root.classList.add('dark');" : "root.classList.remove('dark');"}}catch(e){}})();</script>`;
      if (html.includes("</head>")) return html.replace("</head>", `${override}${themeScript}</head>`);
      return `${override}${themeScript}${html}`;
    };

    const load = async () => {
      setSrcDoc("");
      try {
        const response = await fetch(url, { cache: "no-store" });
        const html = await response.text();
        if (!isCancelled) setSrcDoc(injectTheme(html));
      } catch {
        if (!isCancelled) setSrcDoc("");
      }
    };

    void load();
    return () => {
      isCancelled = true;
    };
  }, [url, theme]);

  return (
    <div
      className={`relative overflow-hidden bg-[var(--app-bg)] ${embedded ? "h-[calc(100vh-8rem)] w-full rounded-2xl border border-[var(--app-border)]" : "h-screen w-screen"}`}
      style={appVars}
    >
      {srcDoc && (
        <iframe
          key={`calendar-${theme}`}
          title="OWO Calendar"
          srcDoc={srcDoc}
          className="h-full w-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads"
        />
      )}

      {!embedded && (
        <Link
          href="/app"
          className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm font-medium text-[var(--app-text)] hover:bg-[var(--app-bg)]"
        >
          <ArrowLeft size={15} />
          Back to CRM
        </Link>
      )}
    </div>
  );
}
