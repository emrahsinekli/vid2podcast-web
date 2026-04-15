import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://vid2podcast.com"),
  title: {
    default: "Vid2Podcast — Turn YouTube Videos into Podcasts",
    template: "%s | Vid2Podcast",
  },
  description:
    "Turn any YouTube video into a podcast in your language. Get instant transcripts, AI summaries, translations into 30+ languages, and high-quality text-to-speech audio. Free Chrome extension.",
  keywords: [
    "youtube to podcast",
    "youtube transcript",
    "youtube audio",
    "youtube summary",
    "ai transcript",
    "youtube to mp3",
    "video to podcast",
    "youtube translation",
    "text to speech youtube",
    "listen to youtube",
  ],
  authors: [{ name: "Vid2Podcast" }],
  creator: "Vid2Podcast",
  publisher: "Vid2Podcast",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://vid2podcast.com",
    siteName: "Vid2Podcast",
    title: "Vid2Podcast — Turn YouTube Videos into Podcasts",
    description:
      "Turn any YouTube video into a podcast in your language. Instant transcript, AI summary, translation & audio. Free Chrome extension.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Vid2Podcast — Turn YouTube Videos into Podcasts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vid2Podcast — Turn YouTube Videos into Podcasts",
    description: "Instant transcript, AI summary, translation & high-quality audio for any YouTube video.",
    images: ["/og-image.png"],
    creator: "@vid2podcast",
  },
  alternates: {
    canonical: "https://vid2podcast.com",
    languages: {
      "en-US": "https://vid2podcast.com",
      "tr-TR": "https://vid2podcast.com",
      "de-DE": "https://vid2podcast.com",
      "fr-FR": "https://vid2podcast.com",
      "es-ES": "https://vid2podcast.com",
      "ja-JP": "https://vid2podcast.com",
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo48.png", type: "image/png", sizes: "48x48" },
    ],
    apple: "/logo128.png",
  },
  manifest: "/manifest.json",
  verification: {
    google: "add-your-google-search-console-token-here",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Vid2Podcast",
              "applicationCategory": "BrowserApplication",
              "operatingSystem": "Chrome",
              "description": "Turn any YouTube video into a podcast in your language. Instant transcript, AI summary, translation & audio.",
              "url": "https://vid2podcast.com",
              "logo": "https://vid2podcast.com/logo.png",
              "offers": {
                "@type": "AggregateOffer",
                "lowPrice": "0",
                "highPrice": "9.99",
                "priceCurrency": "USD",
                "offers": [
                  { "@type": "Offer", "name": "Free", "price": "0", "priceCurrency": "USD" },
                  { "@type": "Offer", "name": "Pro", "price": "9.99", "priceCurrency": "USD", "description": "One-time payment, lifetime access" }
                ]
              },
              "featureList": [
                "YouTube transcript extraction",
                "AI-powered summarization",
                "Translation into 30+ languages",
                "Text-to-speech with 20+ voices",
                "Export to PDF, TXT, SRT",
                "Notion and Obsidian integration",
              ],
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "120"
              }
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
