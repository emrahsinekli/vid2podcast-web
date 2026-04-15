import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "es", "fr", "de", "tr", "pt"],
  defaultLocale: "en",
  localePrefix: "as-needed", // en has no prefix, others get /es, /fr, /de, /tr, /pt
});
