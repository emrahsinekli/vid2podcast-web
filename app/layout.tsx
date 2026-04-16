import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

const SITE_URL = "https://vid2podcast.com";
const OG_IMAGE = `${SITE_URL}/og?title=Turn%20YouTube%20Videos%20into%20Podcasts&desc=Instant%20transcript%20%C2%B7%20AI%20summary%20%C2%B7%2050%2B%20languages%20%C2%B7%20Natural%20audio`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Vid2Podcast — Turn YouTube Videos into Podcasts",
    template: "%s | Vid2Podcast",
  },
  description:
    "Turn any YouTube video into a podcast in seconds. Get instant transcripts, AI-powered summaries, translations into 50+ languages, and high-quality text-to-speech audio. Free to start.",
  keywords: [
    // Core product
    "youtube to podcast",
    "youtube transcript",
    "youtube audio converter",
    "youtube summary ai",
    "youtube to text",
    "youtube to mp3",
    "video to podcast",
    // Features
    "ai transcript generator",
    "youtube translation",
    "text to speech youtube",
    "listen to youtube",
    "youtube captions download",
    "youtube subtitle extractor",
    // Long-tail
    "convert youtube video to podcast",
    "youtube video summarizer",
    "ai youtube summarizer",
    "youtube lecture notes",
    "youtube transcript summary",
    "youtube to text converter free",
    "listen to youtube while driving",
  ],
  authors: [{ name: "Vid2Podcast", url: SITE_URL }],
  creator: "Vid2Podcast",
  publisher: "Vid2Podcast",
  category: "technology",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Vid2Podcast",
    title: "Vid2Podcast — Turn YouTube Videos into Podcasts",
    description:
      "Turn any YouTube video into a podcast in your language. Instant transcript, AI summary, 50+ language translation & natural audio. Free to start.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Vid2Podcast — Turn YouTube Videos into Podcasts",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@vid2podcast",
    creator: "@vid2podcast",
    title: "Vid2Podcast — Turn YouTube Videos into Podcasts",
    description: "Instant transcript, AI summary, 50+ language translation & natural audio for any YouTube video.",
    images: [OG_IMAGE],
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en":    SITE_URL,
      "tr":    `${SITE_URL}/tr`,
      "de":    `${SITE_URL}/de`,
      "fr":    `${SITE_URL}/fr`,
      "es":    `${SITE_URL}/es`,
      "pt":    `${SITE_URL}/pt`,
      "x-default": SITE_URL,
    },
  },
  icons: {
    icon: [
      { url: "/logo48.png", type: "image/png", sizes: "48x48" },
      { url: "/logo128.png", type: "image/png", sizes: "128x128" },
      { url: "/logo.png", type: "image/png", sizes: "256x256" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
    shortcut: "/logo48.png",
  },
  manifest: "/manifest.json",
  // Add your Google Search Console token here:
  // verification: { google: "YOUR_TOKEN_HERE" },
};

const structuredData = [
  // 1. SoftwareApplication
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Vid2Podcast",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Web, Chrome",
    "description": "Turn any YouTube video into a podcast. Instant transcript, AI summary, 50+ language translation, and natural text-to-speech audio.",
    "url": SITE_URL,
    "logo": `${SITE_URL}/logo.png`,
    "screenshot": OG_IMAGE,
    "offers": [
      { "@type": "Offer", "name": "Free", "price": "0", "priceCurrency": "USD" },
      { "@type": "Offer", "name": "Monthly", "price": "9.99", "priceCurrency": "USD", "billingDuration": "P1M" },
      { "@type": "Offer", "name": "Yearly", "price": "79.99", "priceCurrency": "USD", "billingDuration": "P1Y" },
      { "@type": "Offer", "name": "Lifetime", "price": "149.99", "priceCurrency": "USD" },
    ],
    "featureList": [
      "YouTube transcript extraction",
      "AI-powered summarization",
      "Translation into 50+ languages",
      "Text-to-speech with Neural2 voices",
      "Playlist batch conversion",
      "Audio download (MP3/WAV/OGG)",
      "AI chat about video content",
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "143",
      "bestRating": "5",
    },
  },
  // 2. Organization
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Vid2Podcast",
    "url": SITE_URL,
    "logo": `${SITE_URL}/logo.png`,
    "sameAs": [],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "support@vid2podcast.com",
    },
  },
  // 3. WebSite (enables Google Sitelinks Search Box)
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Vid2Podcast",
    "url": SITE_URL,
    "description": "Turn any YouTube video into a podcast in your language.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${SITE_URL}/app?url={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://vid2podcast-backend.vercel.app" />
        <meta name="theme-color" content="#8b5cf6" />
        {structuredData.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
