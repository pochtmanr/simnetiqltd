import "server-only";
import type { Locale } from "./i18n";

const loaders = {
  en: () => import("@/messages/en.json").then((m) => m.default),
  he: () => import("@/messages/he.json").then((m) => m.default),
} satisfies Record<Locale, () => Promise<Dictionary>>;

export type Dictionary = typeof import("@/messages/en.json");

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return loaders[locale]();
}
