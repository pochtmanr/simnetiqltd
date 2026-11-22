import type { MetadataRoute } from "next";
import { lastModifiedFor } from "@/lib/content-dates";
import { getAllHowWeWorkSlugs } from "@/lib/how-we-work";
import { getAllServiceSlugs } from "@/lib/services";
import { LOCALES, LOCALE_HTML_LANG } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

type ChangeFreq = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

function buildEntry(
  path: string,
  changeFrequency: ChangeFreq,
  priority: number
): MetadataRoute.Sitemap {
  const lastModified = lastModifiedFor(path);
  return LOCALES.map((locale) => {
    const languages: Record<string, string> = Object.fromEntries(
      LOCALES.map((l) => [LOCALE_HTML_LANG[l], `${SITE_URL}/${l}${path}`])
    );
    languages["x-default"] = `${SITE_URL}/en${path}`;
    return {
      url: `${SITE_URL}/${locale}${path}`,
      lastModified,
      changeFrequency,
      priority,
      alternates: { languages },
    };
  });
}

export default function sitemap(): MetadataRoute.Sitemap {
  const localizedRoutes: { path: string; freq: ChangeFreq; priority: number }[] = [
    { path: "", freq: "weekly", priority: 1 },
    { path: "/projects", freq: "monthly", priority: 0.9 },
    { path: "/projects/argus-browser", freq: "monthly", priority: 0.85 },
    { path: "/projects/doppler-vpn", freq: "monthly", priority: 0.85 },
    { path: "/projects/physics-explained", freq: "monthly", priority: 0.85 },
    { path: "/projects/green-flagged", freq: "monthly", priority: 0.8 },
    { path: "/projects/sms-code", freq: "monthly", priority: 0.85 },
    { path: "/projects/visapassage", freq: "monthly", priority: 0.85 },
    { path: "/services", freq: "monthly", priority: 0.9 },
    { path: "/how-we-work", freq: "monthly", priority: 0.85 },
    { path: "/about", freq: "monthly", priority: 0.8 },
  ];

  const staticEntries: MetadataRoute.Sitemap = localizedRoutes.flatMap((r) =>
    buildEntry(r.path, r.freq, r.priority)
  );

  const serviceEntries: MetadataRoute.Sitemap = getAllServiceSlugs().flatMap(
    (slug) => buildEntry(`/services/${slug}`, "monthly", 0.8)
  );

  const howWeWorkEntries: MetadataRoute.Sitemap =
    getAllHowWeWorkSlugs().flatMap((slug) =>
      buildEntry(`/how-we-work/${slug}`, "monthly", 0.8)
    );

  return [...staticEntries, ...serviceEntries, ...howWeWorkEntries];
}
