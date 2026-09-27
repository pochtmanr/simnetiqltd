import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SubscribeClient } from "@/components/subscribe-client";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";
import { buildLocalizedMetadata } from "@/lib/seo-meta";

type Params = Promise<{ locale: string }>;
type SearchParams = Promise<{ confirmed?: string | string[] }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? (rawLocale as Locale) : "en";
  return {
    ...buildLocalizedMetadata({
      locale,
      routeKey: "subscribe",
      path: "/subscribe",
    }),
    robots: { index: false, follow: true },
  };
}

const VALID_CONFIRM_STATES = [
  "ok",
  "already",
  "invalid",
  "error",
  "unsubscribed",
] as const;
type ConfirmState = (typeof VALID_CONFIRM_STATES)[number];

function parseConfirmState(value: string | undefined): ConfirmState | null {
  if (!value) return null;
  return (VALID_CONFIRM_STATES as readonly string[]).includes(value)
    ? (value as ConfirmState)
    : null;
}

export default async function SubscribePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  const sp = await searchParams;
  const confirmedRaw = Array.isArray(sp.confirmed) ? sp.confirmed[0] : sp.confirmed;

  return (
    <SubscribeClient
      dict={dict.subscribe}
      locale={locale}
      initialConfirmState={parseConfirmState(confirmedRaw)}
    />
  );
}
