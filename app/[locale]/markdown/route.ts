import { LOCALES, isLocale } from "@/lib/i18n";
import { buildHomeMarkdown } from "@/lib/llms-txt";
import { markdownResponse } from "@/lib/markdown-negotiation";

export const dynamic = "force-static";
export const revalidate = 86400;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  if (!isLocale(locale)) return new Response("Not found", { status: 404 });
  return markdownResponse(buildHomeMarkdown(locale));
}
