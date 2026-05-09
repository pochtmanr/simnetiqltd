import { LOCALES } from "@/lib/i18n";

export { GET } from "../../llms-full.txt/route";

export const dynamic = "force-static";
export const revalidate = 86400;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}
