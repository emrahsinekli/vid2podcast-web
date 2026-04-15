import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";

type Locale = (typeof routing.locales)[number];

// Per-locale metadata (title + description for SEO)
const localeMetadata: Record<Locale, { title: string; description: string; ogLocale: string }> = {
  en: {
    title: "Vid2Podcast — Turn YouTube Videos into Podcasts",
    description: "Turn any YouTube video into a podcast in your language. Instant transcript, AI summary, 50+ language translation, and natural audio. Free Chrome extension.",
    ogLocale: "en_US",
  },
  es: {
    title: "Vid2Podcast — Convierte Videos de YouTube en Podcasts",
    description: "Convierte cualquier video de YouTube en un podcast en tu idioma. Transcripción instantánea, resumen con IA, traducción en 50+ idiomas y audio natural. Extensión Chrome gratuita.",
    ogLocale: "es_ES",
  },
  fr: {
    title: "Vid2Podcast — Transformez les Vidéos YouTube en Podcasts",
    description: "Transformez n'importe quelle vidéo YouTube en podcast dans votre langue. Transcription instantanée, résumé IA, traduction en 50+ langues et audio naturel. Extension Chrome gratuite.",
    ogLocale: "fr_FR",
  },
  de: {
    title: "Vid2Podcast — YouTube-Videos in Podcasts umwandeln",
    description: "Wandle jedes YouTube-Video in einen Podcast in deiner Sprache um. Sofortige Transkription, KI-Zusammenfassung, Übersetzung in 50+ Sprachen und natürliches Audio. Kostenlose Chrome-Erweiterung.",
    ogLocale: "de_DE",
  },
  tr: {
    title: "Vid2Podcast — YouTube Videolarını Podcast'e Dönüştür",
    description: "Herhangi bir YouTube videosunu kendi dilinde podcast'e dönüştür. Anında transkript, yapay zeka özeti, 50+ dil çevirisi ve doğal ses. Ücretsiz Chrome uzantısı.",
    ogLocale: "tr_TR",
  },
  pt: {
    title: "Vid2Podcast — Transforme Vídeos do YouTube em Podcasts",
    description: "Transforme qualquer vídeo do YouTube em podcast no seu idioma. Transcrição instantânea, resumo com IA, tradução em 50+ idiomas e áudio natural. Extensão Chrome gratuita.",
    ogLocale: "pt_BR",
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
  languages["x-default"] = "https://vid2podcast.com";

  return {
    title: meta.title,
    description: meta.description,
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
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: meta.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: ["/og-image.png"],
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
