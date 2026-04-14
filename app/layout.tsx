import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vid2Podcast — Turn YouTube Videos into Podcasts",
  description: "Turn any YouTube video into a podcast in your language. Instant transcript, AI summary, translation & audio.",
  openGraph: {
    title: "Vid2Podcast — Listen to YouTube in Any Language",
    description: "Instant transcript, AI summary, translation & audio for any YouTube video.",
    url: "https://vid2podcast.com",
    images: [{ url: "/logo.png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
