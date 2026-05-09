import { buildLlmsTxt } from "@/lib/llms-txt";
import { LOCALES, isLocale } from "@/lib/i18n";

export const dynamic = "force-static";
export const revalidate = 86400;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(buildLlmsTxt(locale), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
