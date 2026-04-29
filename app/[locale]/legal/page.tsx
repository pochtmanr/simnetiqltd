import { notFound } from "next/navigation";
import { LegalClient } from "@/components/legal-client";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";

type Params = Promise<{ locale: string }>;

export default async function LegalPage({ params }: { params: Params }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);

  return <LegalClient dict={dict.legal} common={dict.common} />;
}
