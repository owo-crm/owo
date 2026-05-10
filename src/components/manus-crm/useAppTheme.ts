"use client";

import { useEffect, useState } from "react";

export type AppTheme = "light" | "dark";

export function useAppTheme(defaultTheme: AppTheme = "light") {
  const [theme, setTheme] = useState<AppTheme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    const saved = window.localStorage.getItem("owocrm-app-theme");
    return saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    const onThemeEvent = (event: Event) => {
      const custom = event as CustomEvent<AppTheme>;
      if (custom.detail === "light" || custom.detail === "dark") {
        setTheme(custom.detail);
      }
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === "owocrm-app-theme") {
        setTheme(event.newValue === "dark" ? "dark" : "light");
      }
    };

    window.addEventListener("owocrm-theme-change", onThemeEvent as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("owocrm-theme-change", onThemeEvent as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return { theme, isDark: theme === "dark" };
}

