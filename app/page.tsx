"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useUser } from "@/components/UserProvider";
import { POLAR_BUY_URL } from "@/lib/constants";

// ─── Sign In Modal ─────────────────────────────────────────────────────────────
function SignInModal({ onClose }: { onClose: () => void }) {
  const { signIn } = useUser();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl border p-8 shadow-2xl"
        style={{ background: "#111118", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#606070] hover:text-[#f0f0f5] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="Vid2Podcast" width={48} height={48} className="rounded-xl" />
          </div>
          <h2 className="text-2xl font-bold text-[#f0f0f5] mb-2">Welcome back</h2>
          <p className="text-[#a0a0b0] text-sm">Sign in to access your conversions and settings</p>
        </div>
        <button
          onClick={signIn}
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl border font-semibold text-[#f0f0f5] hover:bg-white/5 transition-all duration-200"
          style={{ borderColor: "rgba(255,255,255,0.15)" }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </button>
        <p className="text-center text-xs text-[#606070] mt-6">
          By signing in you agree to our{" "}
          <Link href="/privacy" className="text-[#8b5cf6] hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}

// ─── Browser Mockup ─────────────────────────────────────────────────────────────
function BrowserMockup() {
  return (
    <div
      className="relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-2xl border"
      style={{ borderColor: "rgba(255,255,255,0.1)", background: "#111118" }}
    >
      {/* Browser chrome */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ background: "#1a1a24", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <div
          className="flex-1 mx-4 rounded-md px-3 py-1 text-xs text-[#606070] flex items-center gap-2"
          style={{ background: "#0a0a0f" }}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          youtube.com/watch?v=dQw4w9WgXcQ
        </div>
      </div>
      {/* Extension popup area */}
      <div className="relative" style={{ background: "#0a0a0f" }}>
        {/* Fake YouTube bg */}
        <div
          className="w-full h-44 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #1a1a24 0%, #111118 100%)" }}
        >
          <div className="text-center opacity-40">
            <svg className="w-16 h-16 mx-auto text-[#606070] mb-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
            </svg>
            <span className="text-[#606070] text-xs">YouTube Video</span>
          </div>
        </div>
        {/* Extension panel */}
        <div
          className="absolute right-4 top-3 w-64 rounded-xl border shadow-2xl overflow-hidden"
          style={{ background: "#111118", borderColor: "rgba(139,92,246,0.3)" }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2.5 border-b"
            style={{ background: "#1a1a24", borderColor: "rgba(255,255,255,0.08)" }}
          >
            <Image src="/logo.png" alt="" width={18} height={18} className="rounded" />
            <span className="text-xs font-semibold text-[#f0f0f5]">Vid2Podcast</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full text-[#22c55e] font-medium" style={{ background: "rgba(34,197,94,0.1)" }}>
              PRO
            </span>
          </div>
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-1 justify-center py-2">
              {[3, 6, 9, 7, 4, 8, 5, 10, 6, 3, 7, 9, 5, 4, 8].map((h, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full"
                  style={{
                    height: `${h * 2}px`,
                    background: i % 3 === 0 ? "#8b5cf6" : i % 3 === 1 ? "#a78bfa" : "#6d28d9",
                  }}
                />
              ))}
            </div>
            <div className="text-[10px] text-[#a0a0b0] text-center">Generating audio...</div>
            <div className="flex gap-1.5 mt-2">
              {["Transcript", "Summary", "Chat"].map((tab, i) => (
                <div key={tab} className="flex-1 rounded-lg py-1.5 text-center text-[10px] font-medium" style={{ background: i === 0 ? "#8b5cf6" : "rgba(255,255,255,0.05)", color: i === 0 ? "#fff" : "#a0a0b0" }}>
                  {tab}
                </div>
              ))}
            </div>
            <div className="rounded-lg p-2 text-[10px] text-[#a0a0b0] leading-relaxed" style={{ background: "rgba(255,255,255,0.03)" }}>
              Welcome back to the channel. Today we&#39;re going to be talking about something really exciting...
            </div>
            <div className="flex items-center gap-1.5">
              <button className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0" style={{ background: "#8b5cf6" }}>
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </button>
              <div className="flex-1 rounded-full h-1" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div className="w-1/3 h-full rounded-full" style={{ background: "#8b5cf6" }} />
              </div>
              <span className="text-[9px] text-[#606070]">1x</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Feature Card ───────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div
      className="p-6 rounded-2xl border transition-all duration-300 hover:border-[#8b5cf6]/40 hover:-translate-y-1 group cursor-default"
      style={{ background: "#111118", borderColor: "rgba(255,255,255,0.08)" }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
        style={{ background: "rgba(139,92,246,0.15)" }}
      >
        <div className="text-[#a78bfa]">{icon}</div>
      </div>
      <h3 className="font-semibold text-[#f0f0f5] mb-2">{title}</h3>
      <p className="text-sm text-[#a0a0b0] leading-relaxed">{desc}</p>
    </div>
  );
}

// ─── FAQ Item ───────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border rounded-xl overflow-hidden transition-all duration-200"
      style={{ borderColor: open ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.08)", background: "#111118" }}
    >
      <button
        className="w-full flex items-center justify-between px-6 py-4 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="font-medium text-[#f0f0f5] pr-4">{q}</span>
        <svg
          className={`w-5 h-5 text-[#8b5cf6] flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm text-[#a0a0b0] leading-relaxed border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="pt-4">{a}</p>
        </div>
      )}
    </div>
  );
}

// ─── Pricing Card ───────────────────────────────────────────────────────────────
function PricingCard({
  name, price, desc, features, cta, href, highlighted,
}: {
  name: string; price: string; desc: string; features: string[];
  cta: string; href: string; highlighted?: boolean;
}) {
  return (
    <div
      className={`relative p-8 rounded-2xl border flex flex-col transition-all duration-300 ${highlighted ? "scale-105 shadow-2xl shadow-purple-500/20" : ""}`}
      style={{
        background: highlighted ? "linear-gradient(135deg, #1a1a24 0%, #16102a 100%)" : "#111118",
        borderColor: highlighted ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.08)",
      }}
    >
      {highlighted && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 rounded-full text-xs font-semibold text-white" style={{ background: "#8b5cf6" }}>
            Best Value
          </span>
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[#f0f0f5] mb-1">{name}</h3>
        <div className="flex items-end gap-1 mb-3">
          <span className="text-4xl font-black text-[#f0f0f5]">{price}</span>
          {price !== "$0" && <span className="text-[#a0a0b0] mb-1.5 text-sm">one-time</span>}
        </div>
        <p className="text-sm text-[#a0a0b0]">{desc}</p>
      </div>
      <ul className="space-y-3 mb-8 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-[#a0a0b0]">
            <svg className="w-4 h-4 text-[#22c55e] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`block w-full text-center py-3 rounded-xl font-semibold transition-all duration-200 ${
          highlighted ? "text-white hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/25" : "text-[#f0f0f5] hover:bg-white/5"
        }`}
        style={highlighted ? { background: "#8b5cf6" } : { border: "1px solid rgba(255,255,255,0.12)" }}
      >
        {cta}
      </Link>
    </div>
  );
}

// ─── Inner page (uses useSearchParams) ─────────────────────────────────────────
function LandingInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showSignIn, setShowSignIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, loading } = useUser();

  // Already logged in → go straight to app
  useEffect(() => {
    if (!loading && user) router.replace("/app");
  }, [user, loading, router]);

  useEffect(() => {
    if (searchParams.get("signin") === "1") setShowSignIn(true);
  }, [searchParams]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const closeModal = () => {
    setShowSignIn(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("signin");
    router.replace(url.pathname + (url.search || ""));
  };

  const features = [
    {
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      title: "Instant Transcript",
      desc: "Full transcript extracted in seconds from any YouTube video — no waiting, no sign-up required.",
    },
    {
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
      title: "AI Summary",
      desc: "Multiple summary modes — TLDR, key points, detailed notes, or Twitter thread format.",
    },
    {
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>,
      title: "30+ Languages",
      desc: "Listen in your native language. Translate transcripts into 30+ languages with one click.",
    },
    {
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>,
      title: "Natural TTS",
      desc: "High-quality text-to-speech using browser voices (free) or Google Neural2 voices (Pro).",
    },
    {
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
      title: "Ask About Video",
      desc: "Chat with the transcript. Ask questions, get answers, and deep-dive into any topic.",
    },
    {
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
      title: "Export Everywhere",
      desc: "Download transcripts as TXT files. Copy text, share summaries, save audio locally.",
    },
  ];

  const steps = [
    { num: "01", title: "Paste any YouTube URL", desc: "Copy a YouTube link and paste it into Vid2Podcast — or use the Chrome extension directly on the page." },
    { num: "02", title: "Choose language & mode", desc: "Pick your target language and summary type. We'll fetch the transcript and translate it instantly." },
    { num: "03", title: "Listen, read, and explore", desc: "Play the audio, read the transcript, get a summary, or chat with the content — all in one place." },
  ];

  const faqItems = [
    { q: "Is Vid2Podcast really free?", a: "Yes! The Chrome extension and web app are free to use with 1 conversion per day and limited AI chat. The Pro plan ($9.99 one-time, no subscription) removes all limits." },
    { q: "What YouTube videos does it work with?", a: "Any YouTube video that has captions available — auto-generated or manual. Most videos have auto-generated captions in at least one language." },
    { q: "How does translation work?", a: "We use server-side translation to convert the transcript to your chosen language. The translation preserves meaning and context, not just word-for-word translation." },
    { q: "What's the difference between Free and Pro?", a: "Free gives you 1 conversion/day, 2 AI chat messages, and browser TTS. Pro is a one-time payment that unlocks unlimited conversions, unlimited chat, Google Neural2 voices, and priority processing." },
    { q: "Do I need to create an account?", a: "No account needed for basic conversions. Sign in with Google to save your history, sync settings, and access Pro features." },
    { q: "Does it work on mobile?", a: "The web app at vid2podcast.com works on any device. The Chrome extension is desktop-only (Chrome, Brave, Edge)." },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0f", color: "#f0f0f5" }}>
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .gradient-text {
          background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 40%, #6366f1 80%, #22c55e 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .glow-purple { box-shadow: 0 0 60px rgba(139,92,246,0.15), 0 0 120px rgba(139,92,246,0.08); }
      `}</style>

      {/* ── Nav ── */}
      <nav
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${scrolled ? "border-b py-3" : "py-4"}`}
        style={{
          background: scrolled ? "rgba(10,10,15,0.95)" : "transparent",
          borderColor: "rgba(255,255,255,0.07)",
          backdropFilter: scrolled ? "blur(20px)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="logo-spin-once" style={{ width: 32, height: 32, flexShrink: 0 }}>
              <Image src="/logo.png" alt="Vid2Podcast" width={32} height={32} className="rounded-lg" />
            </div>
            <span className="font-bold text-[#f0f0f5]">Vid2Podcast</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 ml-6">
            {["Features", "Pricing", "FAQ"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm text-[#a0a0b0] hover:text-[#f0f0f5] transition-colors">
                {item}
              </a>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button onClick={() => setShowSignIn(true)} className="hidden sm:block text-sm text-[#a0a0b0] hover:text-[#f0f0f5] transition-colors px-3 py-1.5">
              Sign In
            </button>
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/25"
              style={{ background: "#8b5cf6" }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" /></svg>
              Add to Chrome
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)", filter: "blur(80px)" }} />
          <div className="absolute top-64 -left-32 w-[400px] h-[400px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)", filter: "blur(60px)" }} />
          <div className="absolute top-64 -right-32 w-[400px] h-[400px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #22c55e 0%, transparent 70%)", filter: "blur(60px)" }} />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium mb-8"
            style={{ background: "rgba(139,92,246,0.1)", borderColor: "rgba(139,92,246,0.3)", color: "#a78bfa" }}>
            <span>✨</span>
            <span>Free Chrome Extension — No Account Needed</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
            Turn Any YouTube Video
            <br />
            <span className="gradient-text">Into a Podcast</span>
          </h1>

          <p className="text-xl text-[#a0a0b0] max-w-2xl mx-auto mb-10 leading-relaxed">
            Instant transcript, AI summary, 30+ language translation, and natural audio playback — right in your browser or on the web.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-white text-lg transition-all duration-200 hover:opacity-90 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" /></svg>
              Add to Chrome — It&apos;s Free
            </a>
            <Link
              href="/app"
              className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-[#f0f0f5] text-lg border transition-all duration-200 hover:bg-white/5 hover:-translate-y-0.5"
              style={{ borderColor: "rgba(255,255,255,0.15)" }}
            >
              Try Web App
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>

          <div className="animate-float glow-purple">
            <BrowserMockup />
          </div>

          <p className="mt-6 text-sm text-[#606070]">
            No credit card required · Works on Chrome, Brave, Edge · 30+ languages
          </p>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#f0f0f5] mb-4">
              Everything you need to <span className="gradient-text">learn faster</span>
            </h2>
            <p className="text-[#a0a0b0] text-lg max-w-2xl mx-auto">
              Vid2Podcast transforms how you consume video content — turning passive watching into active learning.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 px-6" style={{ background: "#111118" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#f0f0f5] mb-4">
              Up and running in <span className="gradient-text">30 seconds</span>
            </h2>
            <p className="text-[#a0a0b0] text-lg">No complex setup. No learning curve. Just paste and play.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.num} className="relative text-center md:text-left">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px -translate-x-8"
                    style={{ background: "linear-gradient(90deg, rgba(139,92,246,0.4) 0%, transparent 100%)" }} />
                )}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl font-black text-xl mb-5"
                  style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}>
                  {step.num}
                </div>
                <h3 className="font-semibold text-[#f0f0f5] text-lg mb-3">{step.title}</h3>
                <p className="text-sm text-[#a0a0b0] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#f0f0f5] mb-4">
              Simple, <span className="gradient-text">honest pricing</span>
            </h2>
            <p className="text-[#a0a0b0] text-lg">No subscriptions. No surprises. Pay once, use forever.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto items-center">
            <PricingCard
              name="Free" price="$0" desc="Perfect for occasional use"
              features={["1 conversion per day", "2 AI chat messages", "30+ language translation", "Browser TTS voices", "Transcript download", "AI summary (limited)"]}
              cta="Get Started Free" href="/app"
            />
            <PricingCard
              name="Pro" price="$9.99" desc="For power users — pay once, keep forever"
              features={["Unlimited conversions", "Unlimited AI chat", "Google Neural2 voices", "All summary types", "Priority processing", "Conversion history"]}
              cta="Upgrade to Pro" href={POLAR_BUY_URL} highlighted
            />
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6" style={{ background: "#111118" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#f0f0f5] mb-4">
              Frequently asked <span className="gradient-text">questions</span>
            </h2>
          </div>
          <div className="space-y-3">
            {faqItems.map((item) => <FaqItem key={item.q} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 px-6">
        <div
          className="max-w-4xl mx-auto text-center rounded-3xl p-12 border relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #16102a 0%, #1a1a24 50%, #0d1a12 100%)", borderColor: "rgba(139,92,246,0.3)" }}
        >
          <div className="absolute inset-0 opacity-30 pointer-events-none"
            style={{ background: "radial-gradient(circle at 50% 0%, rgba(139,92,246,0.3) 0%, transparent 60%)" }} />
          <div className="relative">
            <h2 className="text-4xl font-bold text-[#f0f0f5] mb-4">
              Start listening smarter <span className="gradient-text">today</span>
            </h2>
            <p className="text-[#a0a0b0] text-lg mb-8 max-w-xl mx-auto">
              Join thousands of users who save hours every week by converting YouTube videos to podcasts.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer"
                className="px-8 py-4 rounded-xl font-semibold text-white text-lg transition-all duration-200 hover:opacity-90 hover:shadow-xl hover:shadow-purple-500/30"
                style={{ background: "#8b5cf6" }}
              >
                Add to Chrome — Free
              </a>
              <Link href="/app" className="px-8 py-4 rounded-xl font-semibold border text-[#f0f0f5] text-lg transition-all duration-200 hover:bg-white/5"
                style={{ borderColor: "rgba(255,255,255,0.15)" }}>
                Open Web App
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-12 px-6" style={{ borderColor: "rgba(255,255,255,0.08)", background: "#111118" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Vid2Podcast" width={28} height={28} className="rounded-lg opacity-80" />
            <span className="text-sm font-semibold text-[#a0a0b0]">Vid2Podcast</span>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Support", href: "mailto:support@vid2podcast.com" },
              { label: "Chrome Store", href: "https://chrome.google.com/webstore" },
            ].map((link) => (
              <a key={link.label} href={link.href}
                className="text-sm text-[#606070] hover:text-[#a0a0b0] transition-colors"
                {...(link.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {link.label}
              </a>
            ))}
          </div>
          <p className="text-xs text-[#606070]">© {new Date().getFullYear()} Vid2Podcast. All rights reserved.</p>
        </div>
      </footer>

      {showSignIn && <SignInModal onClose={closeModal} />}
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense>
      <LandingInner />
    </Suspense>
  );
}
