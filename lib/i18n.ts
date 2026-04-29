export const LOCALES = ["en", "he"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

const RTL_LOCALES: readonly Locale[] = ["he"];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  he: "עברית",
};

export const LOCALE_HTML_LANG: Record<Locale, string> = {
  en: "en-GB",
  he: "he-IL",
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function getDirection(locale: Locale): "ltr" | "rtl" {
  return RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}

export function localizePath(locale: Locale, path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("#")) return path;
  if (path.startsWith("mailto:") || path.startsWith("tel:")) return path;
  const stripped = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${stripped}`;
}
