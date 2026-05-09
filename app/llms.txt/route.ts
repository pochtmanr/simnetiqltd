import { buildLlmsTxt } from "@/lib/llms-txt";
import { DEFAULT_LOCALE } from "@/lib/i18n";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  return new Response(buildLlmsTxt(DEFAULT_LOCALE), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
