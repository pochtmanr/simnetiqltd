import { LOCALES, isLocale } from "@/lib/i18n";
import { buildServiceMarkdown } from "@/lib/llms-txt";
import { markdownResponse } from "@/lib/markdown-negotiation";
import { getAllServiceSlugs } from "@/lib/services";

export const dynamic = "force-static";
export const revalidate = 86400;

export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    getAllServiceSlugs().map((slug) => ({ locale, slug }))
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string; slug: string }> }
) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return new Response("Not found", { status: 404 });
  const md = buildServiceMarkdown(locale, slug);
  if (!md) return new Response("Not found", { status: 404 });
  return markdownResponse(md);
}
