import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";

type Locale = (typeof routing.locales)[number];

// Per-locale metadata (title + description for SEO)
const SITE_URL = "https://vid2podcast.com";

const localeMetadata: Record<Locale, { title: string; description: string; ogLocale: string; keywords: string[] }> = {
  en: {
    title: "Vid2Podcast — Turn YouTube Videos into Podcasts",
    description: "Turn any YouTube video into a podcast in your language. Instant transcript, AI summary, 50+ language translation, and natural audio. Free to start.",
    ogLocale: "en_US",
    keywords: ["youtube to podcast", "youtube transcript", "ai summary", "youtube translation", "text to speech"],
  },
  es: {
    title: "Vid2Podcast — Convierte Videos de YouTube en Podcasts",
    description: "Convierte cualquier video de YouTube en un podcast en tu idioma. Transcripción instantánea, resumen con IA, traducción en 50+ idiomas y audio natural. Gratis para empezar.",
    ogLocale: "es_ES",
    keywords: ["youtube a podcast", "transcripción youtube", "resumen ia youtube", "convertir youtube audio"],
  },
  fr: {
    title: "Vid2Podcast — Transformez les Vidéos YouTube en Podcasts",
    description: "Transformez n'importe quelle vidéo YouTube en podcast dans votre langue. Transcription instantanée, résumé IA, traduction en 50+ langues et audio naturel. Gratuit pour commencer.",
    ogLocale: "fr_FR",
    keywords: ["youtube en podcast", "transcription youtube", "résumé ia youtube", "convertir youtube audio"],
  },
  de: {
    title: "Vid2Podcast — YouTube-Videos in Podcasts umwandeln",
    description: "Wandle jedes YouTube-Video in einen Podcast in deiner Sprache um. Sofortige Transkription, KI-Zusammenfassung, Übersetzung in 50+ Sprachen und natürliches Audio. Kostenlos starten.",
    ogLocale: "de_DE",
    keywords: ["youtube zu podcast", "youtube transkript", "ki zusammenfassung youtube", "youtube audio"],
  },
  tr: {
    title: "Vid2Podcast — YouTube Videolarını Podcast'e Dönüştür",
    description: "Herhangi bir YouTube videosunu kendi dilinde podcast'e dönüştür. Anında transkript, yapay zeka özeti, 50+ dil çevirisi ve doğal ses. Ücretsiz başla.",
    ogLocale: "tr_TR",
    keywords: ["youtube podcast dönüştürücü", "youtube transkript", "yapay zeka özet", "youtube türkçe çeviri"],
  },
  pt: {
    title: "Vid2Podcast — Transforme Vídeos do YouTube em Podcasts",
    description: "Transforme qualquer vídeo do YouTube em podcast no seu idioma. Transcrição instantânea, resumo com IA, tradução em 50+ idiomas e áudio natural. Grátis para começar.",
    ogLocale: "pt_BR",
    keywords: ["youtube para podcast", "transcrição youtube", "resumo ia youtube", "converter youtube audio"],
  },
};

const localeToHreflang: Record<Locale, string> = {
  en: "en",
  es: "es",
  fr: "fr",
  de: "de",
  tr: "tr",
  pt: "pt",
};

function getLocalePath(locale: Locale): string {
  return locale === routing.defaultLocale ? "https://vid2podcast.com" : `https://vid2podcast.com/${locale}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) notFound();

  const l = locale as Locale;
  const meta = localeMetadata[l];

  // Build hreflang alternates
  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[localeToHreflang[loc]] = getLocalePath(loc);
  }
  languages["x-default"] = SITE_URL;

  const ogTitle = encodeURIComponent(meta.title.replace("Vid2Podcast — ", ""));
  const ogDesc = encodeURIComponent(meta.description.split(".")[0]);
  const ogImage = `${SITE_URL}/og?title=${ogTitle}&desc=${ogDesc}`;

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: {
      canonical: getLocalePath(l),
      languages,
    },
    openGraph: {
      type: "website",
      locale: meta.ogLocale,
      url: getLocalePath(l),
      siteName: "Vid2Podcast",
      title: meta.title,
      description: meta.description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: meta.title, type: "image/png" }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@vid2podcast",
      title: meta.title,
      description: meta.description,
      images: [ogImage],
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) notFound();

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
