import { MetadataRoute } from "next";

const BASE = "https://vid2podcast.com";
const LOCALES = ["es", "fr", "de", "tr", "pt"]; // en is at root /

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    // ── Landing pages ──────────────────────────────────────────────────────
    { url: BASE,           lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    ...LOCALES.map((l) => ({
      url: `${BASE}/${l}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),

    // ── App pages (indexed for SEO — no auth wall on these) ───────────────
    { url: `${BASE}/app/upgrade`, lastModified: now, changeFrequency: "weekly",  priority: 0.8 },

    // ── Static pages ───────────────────────────────────────────────────────
    { url: `${BASE}/privacy`,  lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];
}
