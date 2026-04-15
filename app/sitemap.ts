import { MetadataRoute } from "next";

const BASE = "https://vid2podcast.com";
const LOCALES = ["es", "fr", "de", "tr", "pt"]; // en is at root /

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const landingPages: MetadataRoute.Sitemap = [
    // English (canonical root)
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    // Other locales
    ...LOCALES.map((locale) => ({
      url: `${BASE}/${locale}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];

  return [
    ...landingPages,
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];
}
