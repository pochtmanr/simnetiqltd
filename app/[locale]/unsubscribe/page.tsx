import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UnsubscribeClient } from "@/components/unsubscribe-client";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";
import { buildLocalizedMetadata } from "@/lib/seo-meta";

type Params = Promise<{ locale: string }>;
type SearchParams = Promise<{
  email?: string | string[];
  token?: string | string[];
  cold_token?: string | string[];
  status?: string | string[];
}>;

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
      routeKey: "unsubscribe",
      path: "/unsubscribe",
    }),
    robots: { index: false, follow: true },
  };
}

function pickFirst(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function UnsubscribePage({
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

  const newsletterToken = pickFirst(sp.token)?.trim() ?? null;
  const coldToken = pickFirst(sp.cold_token)?.trim() ?? null;
  const email = pickFirst(sp.email)?.trim().toLowerCase() ?? "";
  const statusRaw = pickFirst(sp.status);
  const preStatus =
    statusRaw === "done" || statusRaw === "error" || statusRaw === "invalid"
      ? statusRaw
      : null;

  return (
    <UnsubscribeClient
      dict={dict.unsubscribe}
      locale={locale}
      initialEmail={email}
      newsletterToken={newsletterToken}
      coldToken={coldToken}
      preStatus={preStatus}
    />
  );
}
