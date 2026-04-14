import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Vid2Podcast Privacy Policy. We don't store your transcripts or viewing history.",
  robots: { index: true, follow: false },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0a0a0f", color: "#f0f0f5" }}>
      <nav className="border-b px-6 py-4" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(10,10,15,0.95)" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Vid2Podcast" width={28} height={28} className="rounded-lg" />
            <span className="font-bold text-[#f0f0f5]">Vid2Podcast</span>
          </Link>
          <Link href="/" className="text-sm text-[#a0a0b0] hover:text-[#f0f0f5] transition-colors">← Back</Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-black tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-[#606070] text-sm mb-12">Last updated: April 14, 2025</p>

        <div className="space-y-10 text-[#a0a0b0] leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[#f0f0f5] mb-4">What data we collect</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-[#f0f0f5]">Email address</strong> — only when you sign in with Google, used for license verification.</li>
              <li><strong className="text-[#f0f0f5]">Conversion history</strong> — video title, URL, language, and date of conversions (stored in your account).</li>
              <li><strong className="text-[#f0f0f5]">TTS requests</strong> — text sent to generate audio is forwarded to Google Cloud TTS. We do not log or store it.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#f0f0f5] mb-4">What we do NOT collect</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>We do not store transcript content beyond your conversion history.</li>
              <li>We do not track which YouTube videos you watch.</li>
              <li>We do not sell your data to third parties.</li>
              <li>We do not use tracking pixels or third-party analytics.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#f0f0f5] mb-4">Third-party services</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-[#f0f0f5]">Google Cloud TTS</strong> — text is sent to Google to produce audio.</li>
              <li><strong className="text-[#f0f0f5]">Google Translate</strong> — text is sent to Google for translation.</li>
              <li><strong className="text-[#f0f0f5]">Supabase</strong> — stores user accounts and conversion history.</li>
              <li><strong className="text-[#f0f0f5]">Polar.sh</strong> — processes Pro license payments.</li>
              <li><strong className="text-[#f0f0f5]">Google Sign-In</strong> — for authentication only.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#f0f0f5] mb-4">Data retention</h2>
            <p>Free accounts retain conversion history for 7 days. Pro accounts retain it for 365 days. You can delete your account and all data at any time from Settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#f0f0f5] mb-4">Contact</h2>
            <p>Questions? Email us at <a href="mailto:privacy@vid2podcast.com" className="text-[#8b5cf6] hover:underline">privacy@vid2podcast.com</a></p>
          </section>
        </div>
      </main>
    </div>
  );
}
