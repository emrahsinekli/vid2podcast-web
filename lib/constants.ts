export const LANGUAGES = [
  { code: "original", label: "🌐 Original", flag: "🌐", bcp47: "" },
  { code: "en", label: "🇺🇸 English", flag: "🇺🇸", bcp47: "en-US" },
  { code: "en-GB", label: "🇬🇧 English (UK)", flag: "🇬🇧", bcp47: "en-GB" },
  { code: "tr", label: "🇹🇷 Türkçe", flag: "🇹🇷", bcp47: "tr-TR" },
  { code: "de", label: "🇩🇪 Deutsch", flag: "🇩🇪", bcp47: "de-DE" },
  { code: "es", label: "🇪🇸 Español", flag: "🇪🇸", bcp47: "es-ES" },
  { code: "es-419", label: "🇲🇽 Español (Latam)", flag: "🇲🇽", bcp47: "es-MX" },
  { code: "fr", label: "🇫🇷 Français", flag: "🇫🇷", bcp47: "fr-FR" },
  { code: "it", label: "🇮🇹 Italiano", flag: "🇮🇹", bcp47: "it-IT" },
  { code: "pt-BR", label: "🇧🇷 Português (BR)", flag: "🇧🇷", bcp47: "pt-BR" },
  { code: "pt", label: "🇵🇹 Português (PT)", flag: "🇵🇹", bcp47: "pt-PT" },
  { code: "nl", label: "🇳🇱 Nederlands", flag: "🇳🇱", bcp47: "nl-NL" },
  { code: "pl", label: "🇵🇱 Polski", flag: "🇵🇱", bcp47: "pl-PL" },
  { code: "ru", label: "🇷🇺 Русский", flag: "🇷🇺", bcp47: "ru-RU" },
  { code: "uk", label: "🇺🇦 Українська", flag: "🇺🇦", bcp47: "uk-UA" },
  { code: "el", label: "🇬🇷 Ελληνικά", flag: "🇬🇷", bcp47: "el-GR" },
  { code: "cs", label: "🇨🇿 Čeština", flag: "🇨🇿", bcp47: "cs-CZ" },
  { code: "ro", label: "🇷🇴 Română", flag: "🇷🇴", bcp47: "ro-RO" },
  { code: "hu", label: "🇭🇺 Magyar", flag: "🇭🇺", bcp47: "hu-HU" },
  { code: "sv", label: "🇸🇪 Svenska", flag: "🇸🇪", bcp47: "sv-SE" },
  { code: "da", label: "🇩🇰 Dansk", flag: "🇩🇰", bcp47: "da-DK" },
  { code: "fi", label: "🇫🇮 Suomi", flag: "🇫🇮", bcp47: "fi-FI" },
  { code: "ja", label: "🇯🇵 日本語", flag: "🇯🇵", bcp47: "ja-JP" },
  { code: "ko", label: "🇰🇷 한국어", flag: "🇰🇷", bcp47: "ko-KR" },
  { code: "zh-CN", label: "🇨🇳 中文 (中国)", flag: "🇨🇳", bcp47: "zh-CN" },
  { code: "zh-TW", label: "🇹🇼 中文 (台灣)", flag: "🇹🇼", bcp47: "zh-TW" },
  { code: "ar", label: "🇸🇦 العربية", flag: "🇸🇦", bcp47: "ar-SA" },
  { code: "hi", label: "🇮🇳 हिन्दी", flag: "🇮🇳", bcp47: "hi-IN" },
  { code: "th", label: "🇹🇭 ไทย", flag: "🇹🇭", bcp47: "th-TH" },
  { code: "vi", label: "🇻🇳 Tiếng Việt", flag: "🇻🇳", bcp47: "vi-VN" },
  { code: "id", label: "🇮🇩 Indonesia", flag: "🇮🇩", bcp47: "id-ID" },
  { code: "ms", label: "🇲🇾 Melayu", flag: "🇲🇾", bcp47: "ms-MY" },
];

export const FREE_LIMIT = 1;
export const FREE_CHAT_LIMIT = 2;       // chat messages per day for free users
export const FREE_SUMMARY_DAILY = 1;   // AI summaries per day for free users
export const FREE_SUMMARY_WORDS = 80;
export const FREE_TRANSCRIPT_MINUTES = 15; // max video length (minutes) for free users
export const SIGNUP_CREDITS = 5;
export const DAILY_REFILL_CREDITS = 1;
export const MAX_FREE_CREDITS = 5;
export const GUEST_MAX_TRANSCRIPT_WORDS = 600;
const SITE_URL = "https://vid2podcast.com";

// Single checkout page — shows all 3 plans (Monthly / Yearly / Lifetime)
const POLAR_BASE = "https://buy.polar.sh/polar_cl_PbOP9j9S1vNFdBCbtbK4MlWvPKjqrw6kIr8E62Wy1vp";

// Add success_url so Polar redirects back after payment
export const POLAR_BUY_URL = `${POLAR_BASE}?success_url=${encodeURIComponent(`${SITE_URL}/app?upgraded=true`)}`;

// Helper — builds checkout URL pre-selecting a plan (Polar supports ?product_price_id= for deep linking)
// These IDs come from Polar Dashboard → Products → each price's ID
// Fill in when you have them, otherwise falls back to main checkout
export const POLAR_MONTHLY_URL = POLAR_BUY_URL;   // TODO: replace with monthly product price URL
export const POLAR_YEARLY_URL  = POLAR_BUY_URL;   // TODO: replace with yearly product price URL
export const POLAR_LIFETIME_URL = POLAR_BUY_URL;  // TODO: replace with lifetime product price URL
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://vid2podcast-backend.vercel.app";
export const GUEST_TOKEN = "v2p-guest-2024-zM5kT8wN";
export const WEB_TOKEN = "v2p-web-2024-yL7nQ2pS";
