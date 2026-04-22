import type { MetadataRoute } from "next";
import { getAllServiceSlugs } from "@/lib/services";

const SITE_URL = "https://simnetiq.store";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const serviceEntries: MetadataRoute.Sitemap = getAllServiceSlugs().map(
    (slug) => ({
      url: `${SITE_URL}/services/${slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: {
        languages: {
          "en-GB": `${SITE_URL}/services/${slug}`,
          "x-default": `${SITE_URL}/services/${slug}`,
        },
      },
    })
  );

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          "en-GB": SITE_URL,
          "x-default": SITE_URL,
        },
      },
    },
    {
      url: `${SITE_URL}/projects`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: {
        languages: {
          "en-GB": `${SITE_URL}/projects`,
          "x-default": `${SITE_URL}/projects`,
        },
      },
    },
    {
      url: `${SITE_URL}/services`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: {
        languages: {
          "en-GB": `${SITE_URL}/services`,
          "x-default": `${SITE_URL}/services`,
        },
      },
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: {
        languages: {
          "en-GB": `${SITE_URL}/about`,
          "x-default": `${SITE_URL}/about`,
        },
      },
    },
    {
      url: `${SITE_URL}/#contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/legal`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/delete-account`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  return [...staticEntries, ...serviceEntries];
}
