export type Locale = "en" | "pl";

export const DEFAULT_LOCALE: Locale = "en";

export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) return DEFAULT_LOCALE;
  const normalized = value.toLowerCase();
  if (normalized === "pl") return "pl";
  return DEFAULT_LOCALE;
}

export function getLocaleFromBrowser(search: string, fallback?: string): Locale {
  try {
    const params = new URLSearchParams(search);
    const fromQuery = params.get("lang");
    if (fromQuery) {
      return normalizeLocale(fromQuery);
    }
  } catch {
    // no-op
  }

  return normalizeLocale(fallback);
}
