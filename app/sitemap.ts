import type { MetadataRoute } from "next";
import { getAllServiceSlugs } from "@/lib/services";
import { LOCALES, LOCALE_HTML_LANG } from "@/lib/i18n";

const SITE_URL = "https://simnetiq.store";

type ChangeFreq = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

function buildEntry(
  path: string,
  changeFrequency: ChangeFreq,
  priority: number,
  lastModified: Date
): MetadataRoute.Sitemap {
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
  const now = new Date();

  const localizedRoutes: { path: string; freq: ChangeFreq; priority: number }[] = [
    { path: "", freq: "weekly", priority: 1 },
    { path: "/projects", freq: "monthly", priority: 0.9 },
    { path: "/projects/doppler-vpn", freq: "monthly", priority: 0.85 },
    { path: "/projects/physics-explained", freq: "monthly", priority: 0.85 },
    { path: "/services", freq: "monthly", priority: 0.9 },
    { path: "/about", freq: "monthly", priority: 0.8 },
    { path: "/legal", freq: "yearly", priority: 0.4 },
    { path: "/privacy-policy", freq: "yearly", priority: 0.4 },
    { path: "/delete-account", freq: "yearly", priority: 0.3 },
  ];

  const staticEntries: MetadataRoute.Sitemap = localizedRoutes.flatMap((r) =>
    buildEntry(r.path, r.freq, r.priority, now)
  );

  const serviceEntries: MetadataRoute.Sitemap = getAllServiceSlugs().flatMap(
    (slug) => buildEntry(`/services/${slug}`, "monthly", 0.8, now)
  );

  return [...staticEntries, ...serviceEntries];
}
