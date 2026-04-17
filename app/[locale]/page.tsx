"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useUser } from "@/components/UserProvider";
import { POLAR_BUY_URL, POLAR_MONTHLY_URL, POLAR_YEARLY_URL, POLAR_LIFETIME_URL, BACKEND_URL, GUEST_TOKEN, LANGUAGES } from "@/lib/constants";

const CHROME_STORE_URL = "https://chromewebstore.google.com/detail/mfpcphpkfokoiellglchcegaciljehif?utm_source=landing";

// ─── Scroll-reveal hook ────────────────────────────────────────────────────────
function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.12, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// Reveal wrapper — fades + slides up children when scrolled into view
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}>
      {children}
    </div>
  );
}

// Chrome 2022 icon (flat 3-segment wheel)
function ChromeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M16 16 L16 0 A16 16 0 0 1 29.86 24 Z"/>
      <path fill="#FBBC04" d="M16 16 L29.86 24 A16 16 0 0 1 2.14 24 Z"/>
      <path fill="#34A853" d="M16 16 L2.14 24 A16 16 0 0 1 16 0 Z"/>
      <circle cx="16" cy="16" r="9.5" fill="white"/>
      <circle cx="16" cy="16" r="7.5" fill="#4285F4"/>
    </svg>
  );
}
import { extractVideoId } from "@/lib/utils";

// ─── Sign In Modal ─────────────────────────────────────────────────────────────
// Save pending conversion before sign-in so /app can auto-start
function savePending(url: string, lang: string) {
  try { localStorage.setItem("v2p_pending", JSON.stringify({ url, lang })); } catch {}
}

function SignInModal({ onClose }: { onClose: () => void }) {
  const { signIn } = useUser();
  const tc = useTranslations("converter");
  const [signingIn, setSigningIn] = useState(false);
  const perks = [
    tc("signInPerk1"),
    tc("signInPerk2"),
    tc("signInPerk3"),
    tc("signInPerk4"),
    tc("signInPerk5"),
    tc("signInPerk6"),
  ];
  const handleSignIn = async () => {
    setSigningIn(true);
    await signIn();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.3)" }}>
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa, #8b5cf6, #6366f1)" }} />
        <div className="p-7">
          <button onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", color: "#606070" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-3 mb-1">
            <Image src="/logo.png" alt="Vid2Podcast" width={36} height={36} className="rounded-xl" />
            <span className="font-bold text-[#f0f0f5]">Vid2Podcast</span>
          </div>
          <h2 className="text-2xl font-black text-[#f0f0f5] mt-4 mb-1">{tc("signInTitle")}</h2>
          <p className="text-sm text-[#606070] mb-6">{tc("signInSubtitle")}</p>
          <ul className="space-y-2.5 mb-7">
            {perks.map((perk, i) => (
              <li key={perk} className="flex items-center gap-2.5 text-sm">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: i < 2 ? "rgba(139,92,246,0.2)" : "rgba(34,197,94,0.15)" }}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    style={{ color: i < 2 ? "#a78bfa" : "#22c55e" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className={i < 2 ? "text-[#f0f0f5] font-medium" : "text-[#a0a0b0]"}>{perk}</span>
              </li>
            ))}
          </ul>
          <button onClick={handleSignIn} disabled={signingIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-bold text-white transition-all duration-200 hover:opacity-90 hover:shadow-xl hover:shadow-blue-500/20 mb-3 disabled:opacity-60"
            style={{ background: "#4285F4" }}>
            {signingIn ? (
              <><div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />Redirecting to Google…</>
            ) : (
              <><svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>{tc("signInBtn")}</>
            )}
          </button>
          <p className="text-center text-xs text-[#606070]">
            By signing up you agree to our{" "}
            <Link href="/privacy" className="text-[#8b5cf6] hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Simple extractive summary — pick top sentences by word frequency
function extractiveSummary(text: string, maxWords = 60): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  if (sentences.length <= 2) return sentences.join(" ").split(/\s+/).slice(0, maxWords).join(" ");
  const freq: Record<string, number> = {};
  text.toLowerCase().split(/\s+/).forEach((w) => { if (w.length > 3) freq[w] = (freq[w] || 0) + 1; });
  const scored = sentences.map((s, i) => {
    const words = s.toLowerCase().split(/\s+/);
    const score = words.reduce((a, w) => a + (freq[w] || 0), 0) / (words.length || 1);
    return { s: s.trim(), score: score * (i === 0 ? 2 : 1), idx: i };
  });
  const top = [...scored].sort((a, b) => b.score - a.score).slice(0, 3).sort((a, b) => a.idx - b.idx);
  const result = top.map((x) => x.s).join(" ");
  return result.split(/\s+/).slice(0, maxWords).join(" ");
}

// Free Google Translate (unofficial, no API key)
async function translateText(text: string, targetLang: string): Promise<string> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;
    const r = await fetch(url);
    if (!r.ok) return text;
    const data = await r.json();
    return (data[0] as [string, string][]).map((s) => s[0]).join("");
  } catch {
    return text;
  }
}

// ─── Embedded Converter ────────────────────────────────────────────────────────
function EmbeddedConverter({ onSignIn }: { onSignIn: () => void }) {
  const tc = useTranslations("converter");
  const [ytUrl, setYtUrl] = useState("");
  const [tab, setTab] = useState<"youtube" | "upload">("youtube");
  const [phase, setPhase] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [loadMsg, setLoadMsg] = useState("");
  const [result, setResult] = useState<{ title: string; transcript: string; summary: string; guestLimited?: boolean; targetLang?: string } | null>(null);
  const [error, setError] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [targetLang, setTargetLang] = useState("original");
  const [activeTab, setActiveTab] = useState<"summary" | "transcript">("summary");
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Stop speech on unmount / page navigation / refresh
  useEffect(() => {
    const stop = () => { window.speechSynthesis?.cancel(); setSpeaking(false); };
    window.addEventListener("beforeunload", stop);
    document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
    return () => { stop(); window.removeEventListener("beforeunload", stop); };
  }, []);

  const handleSubmit = async () => {
    setPhase("loading");
    setError("");
    try {
      let transcript = "", title = "Video";
      let guestLimited = false;

      if (tab === "youtube") {
        const videoId = extractVideoId(ytUrl.trim());
        if (!videoId) throw new Error("Invalid YouTube URL. Paste a youtube.com or youtu.be link.");
        setLoadMsg("Fetching transcript...");
        const res = await fetch(`${BACKEND_URL}/api/transcript`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-v2p-token": GUEST_TOKEN },
          body: JSON.stringify({ videoId }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        transcript = data.transcript;
        title = data.title || "YouTube Video";
        guestLimited = !!data.guestLimited;
      } else {
        if (!uploadFile) throw new Error("Please select a file.");
        setLoadMsg("Transcribing in browser...");
        const { transcribeFile } = await import("@/lib/whisper");
        transcript = await transcribeFile(uploadFile, (msg) => setLoadMsg(msg));
        if (!transcript) throw new Error("Could not extract speech from this file.");
        title = uploadFile.name.replace(/\.[^.]+$/, "");
      }

      // Translate if language selected
      let displayTranscript = transcript;
      if (targetLang !== "original") {
        setLoadMsg("Translating...");
        displayTranscript = await translateText(transcript, targetLang);
      }

      const summary = extractiveSummary(displayTranscript, 70);
      setResult({ title, transcript: displayTranscript, summary, guestLimited, targetLang });
      setActiveTab("summary");
      setPhase("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setPhase("error");
    }
  };

  const handleSpeak = () => {
    if (!result) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const utter = new SpeechSynthesisUtterance(result.transcript.slice(0, 4000));
    uttRef.current = utter;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    if (targetLang !== "original") {
      const langEntry = LANGUAGES.find(l => l.code === targetLang);
      if (langEntry?.bcp47) utter.lang = langEntry.bcp47;
    }
    window.speechSynthesis.speak(utter);
    setSpeaking(true);
  };

  if (phase === "done" && result) {
    return (
      <div className="w-full max-w-2xl mx-auto rounded-2xl border overflow-hidden shadow-2xl" style={{ background: "#111118", borderColor: "rgba(139,92,246,0.35)" }}>
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#f0f0f5] truncate max-w-[240px]">{result.title}</h3>
              {result.guestLimited && (
                <p className="text-[10px] text-yellow-400 mt-0.5">⚠ {tc("guestWarning")}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={handleSpeak} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all" style={{ background: speaking ? "#6d28d9" : "#8b5cf6" }}>
                {speaking
                  ? <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>{tc("stop")}</>
                  : <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>{tc("listen")}</>}
              </button>
              <button onClick={() => { window.speechSynthesis.cancel(); setSpeaking(false); setPhase("idle"); setResult(null); }}
                className="px-3 py-1.5 rounded-lg text-xs text-[#a0a0b0] hover:text-[#f0f0f5] transition-colors" style={{ background: "rgba(255,255,255,0.06)" }}>
                {tc("newBtn")}
              </button>
            </div>
          </div>

          {/* Summary / Transcript tabs */}
          <div className="flex gap-1 mb-3 p-0.5 rounded-lg" style={{ background: "#1a1a24" }}>
            {(["summary", "transcript"] as const).map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === t ? "text-white" : "text-[#606070]"}`}
                style={activeTab === t ? { background: "#8b5cf6" } : {}}>
                {t === "summary" ? "✨ AI Summary" : "📄 Transcript"}
              </button>
            ))}
          </div>

          <div className="rounded-xl p-4 text-sm text-[#a0a0b0] leading-relaxed overflow-y-auto mb-4" style={{ background: "#0a0a0f", maxHeight: "180px" }}>
            {activeTab === "summary" ? result.summary : result.transcript}
          </div>

          {/* Sign-up CTA */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(139,92,246,0.3)" }}>
            <div className="px-4 py-2.5" style={{ background: "rgba(139,92,246,0.08)" }}>
              <p className="text-xs font-semibold text-[#f0f0f5] mb-1.5">🎉 {tc("ctaTitle")}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {([["🤖", tc("unlockAi")], ["🔊", tc("unlockVoice")], ["📄", tc("unlockTranscript")], ["📜", tc("unlockHistory")]] as [string, string][]).map(([icon, text]) => (
                  <div key={text} className="flex items-center gap-1 text-[10px] text-[#a0a0b0]"><span>{icon}</span><span>{text}</span></div>
                ))}
              </div>
            </div>
            <div className="px-4 py-2.5" style={{ background: "rgba(139,92,246,0.04)" }}>
              <button onClick={() => {
                // Save pending conversion so /app can auto-start after login
                if (tab === "youtube" && ytUrl.trim()) {
                  try { localStorage.setItem("v2p_pending", JSON.stringify({ url: ytUrl.trim(), lang: targetLang })); } catch {}
                }
                onSignIn();
              }} className="w-full py-2 rounded-lg text-xs font-bold text-white hover:opacity-90 transition-all mb-1.5" style={{ background: "#4285F4" }}>
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24"><path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  {tc("ctaBtn")}
                </span>
              </button>
              <p className="text-center text-[10px] text-[#606070]">{tc("ctaNote")}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl border overflow-hidden shadow-2xl" style={{ background: "#111118", borderColor: "rgba(139,92,246,0.3)" }}>
      <div className="p-5">
        <div className="flex gap-1.5 mb-4 p-1 rounded-xl" style={{ background: "#1a1a24" }}>
          {[{ id: "youtube", label: `🎬 ${tc("tabYoutube")}` }, { id: "upload", label: `📁 ${tc("tabUpload")}` }].map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id as "youtube" | "upload")}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${tab === id ? "text-white" : "text-[#606070] hover:text-[#a0a0b0]"}`}
              style={tab === id ? { background: "#8b5cf6" } : {}}>
              {label}
            </button>
          ))}
        </div>
        {tab === "youtube" ? (
          <input value={ytUrl} onChange={(e) => setYtUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && phase !== "loading" && handleSubmit()}
            placeholder={tc("ytPlaceholder")}
            className="w-full px-4 py-3 rounded-xl text-sm mb-4 outline-none transition-all focus:border-[#8b5cf6]"
            style={{ background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.08)", color: "#f0f0f5" }} />
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:border-[rgba(139,92,246,0.5)] mb-4"
            style={{ borderColor: uploadFile ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.1)" }}>
            <input type="file" className="hidden" accept=".mp3,.wav,.m4a,.ogg,.webm,.mp4,.mov"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
            {uploadFile ? (
              <><span className="text-2xl">🎵</span><span className="text-sm text-[#f0f0f5]">{uploadFile.name}</span><span className="text-xs text-[#606070]">{tc("uploadChange")}</span></>
            ) : (
              <><span className="text-2xl">📁</span><span className="text-sm text-[#a0a0b0]">{tc("uploadIdle")}</span><span className="text-xs text-[#606070]">{tc("uploadFormats")}</span></>
            )}
          </label>
        )}
        {/* Language selector */}
        <div className="mb-4">
          <label className="block text-[10px] text-[#606070] uppercase tracking-wider mb-1.5">{tc("langLabel")}</label>
          <div className="relative">
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full appearance-none px-3 py-2.5 pr-8 rounded-xl text-sm outline-none transition-all cursor-pointer"
              style={{ background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.08)", color: targetLang === "original" ? "#606070" : "#f0f0f5" }}>
              <option value="original">{tc("langOriginal")}</option>
              {LANGUAGES.filter(l => l.code !== "original").map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#606070]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
        </div>

        {phase === "error" && (
          <div className="mb-4 p-3 rounded-xl text-xs text-red-300" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>
        )}
        <button onClick={handleSubmit}
          disabled={phase === "loading" || (tab === "youtube" ? !ytUrl.trim() : !uploadFile)}
          className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" }}>
          {phase === "loading" ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{loadMsg || tc("processing")}</>
          ) : (
            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>{tc("btnTry")}</>
          )}
        </button>
        <p className="text-center text-xs text-[#606070] mt-2">{tc("btnNote")}</p>
      </div>
    </div>
  );
}

// ─── Social Proof & Logo Ticker ───────────────────────────────────────────────
function SocialProof() {
  const tc = useTranslations("converter");
  const stats = [
    { label: tc("statsVideos"), value: 12400, suffix: "+", icon: "🏆" },
    { label: tc("statsLangs"), value: 30, suffix: "+", icon: "🌍" },
    { label: tc("statsRating"), value: 4.9, suffix: "★", isFloat: true, icon: "⭐" },
  ];
  const [counts, setCounts] = useState([0, 0, 0]);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const duration = 1800, interval = 25, steps = duration / interval;
    let step = 0;
    const t = setInterval(() => {
      step++;
      const p = Math.min(step / steps, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCounts(stats.map((s) => s.isFloat ? Math.round(s.value * ease * 10) / 10 : Math.round(s.value * ease)));
      if (step >= steps) clearInterval(t);
    }, interval);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const platforms = ["YouTube", "Vimeo", "Coursera", "TED", "LinkedIn", "Udemy", "Khan Academy", "Twitch", "Netflix", "Rumble", "DailyMotion", "Bilibili"];
  const ticker = [...platforms, ...platforms];

  return (
    <div className="mt-6 space-y-4">
      {/* Award-style stat badges */}
      <div className="flex items-center justify-center gap-4 md:gap-8 flex-wrap">
        {stats.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span className="text-xl">{s.icon}</span>
            <div>
              <div className="text-xl font-black text-[#f0f0f5] leading-none">{counts[i]}{s.suffix}</div>
              <div className="text-[10px] text-[#606070] mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Scrolling platform ticker */}
      <div className="relative overflow-hidden py-2">
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{ background: "linear-gradient(90deg, #0a0a0f 0%, transparent 100%)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{ background: "linear-gradient(270deg, #0a0a0f 0%, transparent 100%)" }} />
        <div className="flex gap-10 animate-ticker w-max">
          {ticker.map((name, i) => (
            <span key={i} className="text-sm font-semibold flex-shrink-0 select-none" style={{ color: "rgba(160,160,176,0.35)" }}>
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Designed For You ──────────────────────────────────────────────────────────
function DesignedForYou() {
  const personas = [
    { icon: "🎓", label: "Students", desc: "Turn lectures into text. Get AI summaries, translate to your language, and study smarter — no more rewinding 2-hour videos.", gradient: "linear-gradient(135deg, #1a1040 0%, #16102a 100%)", accent: "#8b5cf6" },
    { icon: "👩‍🏫", label: "Educators", desc: "Convert teaching material into transcripts, create clear audio lessons, and reach students in any language.", gradient: "linear-gradient(135deg, #0d1a2d 0%, #0a1020 100%)", accent: "#6366f1" },
    { icon: "💼", label: "Professionals", desc: "Turn meetings, webinars, and conference talks into notes, summaries, and shareable text — in minutes.", gradient: "linear-gradient(135deg, #1a1520 0%, #111118 100%)", accent: "#a78bfa" },
    { icon: "🔬", label: "Researchers", desc: "Extract quotes from expert talks and academic videos. Searchable transcripts replace hours of manual note-taking.", gradient: "linear-gradient(135deg, #0d1a12 0%, #0a0a0f 100%)", accent: "#22c55e" },
    { icon: "🎙️", label: "Creators", desc: "Repurpose video content into blog posts, newsletters, episode notes, and social clips — in any language.", gradient: "linear-gradient(135deg, #1a0d10 0%, #111118 100%)", accent: "#f43f5e" },
  ];
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-[#f0f0f5] mb-4">Designed for <span className="gradient-text">You</span></h2>
          <p className="text-[#a0a0b0] text-lg">Whatever you do, Vid2Podcast saves you hours every week.</p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {personas.slice(0, 2).map((p, i) => (
            <Reveal key={p.label} delay={i * 100}>
              <div className="relative rounded-2xl border p-8 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-default group"
                style={{ background: p.gradient, borderColor: `${p.accent}25` }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                  style={{ background: `radial-gradient(circle at 30% 50%, ${p.accent}10 0%, transparent 60%)` }} />
                <div className="text-5xl mb-4">{p.icon}</div>
                <h3 className="text-xl font-bold text-[#f0f0f5] mb-3">{p.label}</h3>
                <p className="text-sm text-[#a0a0b0] leading-relaxed">{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {personas.slice(2).map((p, i) => (
            <Reveal key={p.label} delay={i * 100}>
              <div className="relative rounded-2xl border p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-default group"
                style={{ background: p.gradient, borderColor: `${p.accent}25` }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                  style={{ background: `radial-gradient(circle at 30% 50%, ${p.accent}10 0%, transparent 60%)` }} />
                <div className="text-4xl mb-3">{p.icon}</div>
                <h3 className="text-lg font-bold text-[#f0f0f5] mb-2">{p.label}</h3>
                <p className="text-xs text-[#a0a0b0] leading-relaxed">{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function Testimonials() {
  const reviews = [
    { name: "Sarah M.", role: "Graduate Student", initials: "SM", color: "#8b5cf6", stars: 5, text: "I use Vid2Podcast every day for my coursework. Instead of watching 2-hour lectures, I read the transcript and AI summary in 10 minutes. It's changed how I study completely." },
    { name: "James K.", role: "Marketing Professional", initials: "JK", color: "#6366f1", stars: 5, text: "I needed to research competitor content fast. With Vid2Podcast I can read transcripts of dozens of videos in the time it'd take to watch one. The translation feature is a game changer." },
    { name: "Priya R.", role: "Podcast Creator", initials: "PR", color: "#f43f5e", stars: 5, text: "I repurpose YouTube interviews into show notes, newsletters, and social posts using the transcript. What used to take hours now takes minutes. Absolutely worth it." },
  ];
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <Reveal className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-[#f0f0f5] mb-4">Real Stories, <span className="gradient-text">Real Results</span></h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <Reveal key={r.name} delay={i * 120}>
            <div className="rounded-2xl border p-6 flex flex-col gap-4" style={{ background: "#111118", borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="flex gap-0.5">
                {Array.from({ length: r.stars }).map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-[#a0a0b0] leading-relaxed flex-1">&ldquo;{r.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: r.color }}>{r.initials}</div>
                <div>
                  <p className="text-sm font-semibold text-[#f0f0f5]">{r.name}</p>
                  <p className="text-xs text-[#606070]">{r.role}</p>
                </div>
              </div>
            </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Feature Card ───────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-6 rounded-2xl border transition-all duration-300 hover:border-[#8b5cf6]/40 hover:-translate-y-1 group cursor-default"
      style={{ background: "#111118", borderColor: "rgba(255,255,255,0.08)" }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
        style={{ background: "rgba(139,92,246,0.15)" }}>
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
    <div className="border rounded-xl overflow-hidden transition-all duration-200"
      style={{ borderColor: open ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.08)", background: "#111118" }}>
      <button className="w-full flex items-center justify-between px-6 py-4 text-left" onClick={() => setOpen(!open)}>
        <span className="font-medium text-[#f0f0f5] pr-4">{q}</span>
        <svg className={`w-5 h-5 text-[#8b5cf6] flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
function PricingCard({ name, price, period, desc, features, cta, href, highlighted, badge, trialBadge }: {
  name: string; price: string; period?: string; desc: string; features: string[];
  cta: string; href: string; highlighted?: boolean; badge?: string; trialBadge?: string;
}) {
  return (
    <div className={`relative p-8 rounded-2xl border flex flex-col transition-all duration-300 ${highlighted ? "scale-105 shadow-2xl shadow-purple-500/20" : ""}`}
      style={{ background: highlighted ? "linear-gradient(135deg, #1a1a24 0%, #16102a 100%)" : "#111118", borderColor: highlighted ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.08)" }}>
      {highlighted && badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 rounded-full text-xs font-semibold text-white" style={{ background: "#8b5cf6" }}>{badge}</span>
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[#f0f0f5] mb-1">{name}</h3>
        <div className="flex items-end gap-1 mb-3">
          <span className="text-4xl font-black text-[#f0f0f5]">{price}</span>
          {period && <span className="text-[#a0a0b0] mb-1.5 text-sm">{period}</span>}
        </div>
        <p className="text-sm text-[#a0a0b0]">{desc}</p>
        {trialBadge && (
          <div className="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {trialBadge}
          </div>
        )}
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
      <a href={href} target="_blank" rel="noopener noreferrer"
        className={`block w-full text-center py-3 rounded-xl font-semibold transition-all duration-200 ${highlighted ? "text-white hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/25" : "text-[#f0f0f5] hover:bg-white/5"}`}
        style={highlighted ? { background: "#8b5cf6" } : { border: "1px solid rgba(255,255,255,0.12)" }}>
        {cta}
      </a>
      {trialBadge && <p className="text-center text-[10px] text-[#606070] mt-2">No credit card required for trial</p>}
    </div>
  );
}

// ─── Feature icons (static, language-independent) ──────────────────────────────
const FEATURE_ICONS = [
  <svg key="transcript" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  <svg key="ai" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  <svg key="lang" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>,
  <svg key="tts" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>,
  <svg key="chat" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
  <svg key="export" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
];

// ─── Inner page ─────────────────────────────────────────────────────────────────
function LandingInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showSignIn, setShowSignIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, loading } = useUser();

  const tNav = useTranslations("nav");
  const tHero = useTranslations("hero");
  const tFeatures = useTranslations("features");
  const tHow = useTranslations("howItWorks");
  const tPricing = useTranslations("pricing");
  const tFaq = useTranslations("faq");
  const tCta = useTranslations("cta");
  const tFooter = useTranslations("footer");

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

  const featureItems = (tFeatures.raw("items") as { title: string; desc: string }[]).map(
    (item, i) => ({ ...item, icon: FEATURE_ICONS[i] })
  );
  const steps = tHow.raw("steps") as { num: string; title: string; desc: string }[];
  const faqItems = tFaq.raw("items") as { q: string; a: string }[];
  const freeFeatures = tPricing.raw("free.features") as string[];
  const proFeatures = tPricing.raw("pro.features") as string[];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map((item) => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": { "@type": "Answer", "text": item.a },
    })),
  };

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0f", color: "#f0f0f5" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .gradient-text {
          background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 40%, #6366f1 80%, #22c55e 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .glow-purple { box-shadow: 0 0 60px rgba(139,92,246,0.15), 0 0 120px rgba(139,92,246,0.08); }
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-ticker { animation: ticker 30s linear infinite; }
        .animate-ticker:hover { animation-play-state: paused; }
      `}</style>

      {showSignIn && <SignInModal onClose={closeModal} />}

      {/* ── Nav ── */}
      <nav className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${scrolled ? "border-b py-3" : "py-4"}`}
        style={{ background: scrolled ? "rgba(10,10,15,0.95)" : "transparent", borderColor: "rgba(255,255,255,0.07)", backdropFilter: scrolled ? "blur(20px)" : "none" }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image src="/logo.png" alt="Vid2Podcast" width={32} height={32} className="rounded-lg" />
            <span className="font-bold text-[#f0f0f5]">Vid2Podcast</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 ml-6">
            <a href="#features" className="text-sm text-[#a0a0b0] hover:text-[#f0f0f5] transition-colors">{tNav("features")}</a>
            <a href="#pricing" className="text-sm text-[#a0a0b0] hover:text-[#f0f0f5] transition-colors">{tNav("pricing")}</a>
            <a href="#faq" className="text-sm text-[#a0a0b0] hover:text-[#f0f0f5] transition-colors">{tNav("faq")}</a>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:text-[#f0f0f5]"
              style={{ color: "#a0a0b0", border: "1px solid rgba(255,255,255,0.1)" }}>
              <ChromeIcon className="w-3.5 h-3.5 flex-shrink-0" />
              {tNav("addToChrome")}
            </a>
            <button onClick={() => setShowSignIn(true)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/25"
              style={{ background: "#8b5cf6" }}>
              {tNav("signIn")}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-20 pb-10 px-6 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)", filter: "blur(80px)" }} />
          <div className="absolute top-64 -left-32 w-[400px] h-[400px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)", filter: "blur(60px)" }} />
          <div className="absolute top-64 -right-32 w-[400px] h-[400px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #22c55e 0%, transparent 70%)", filter: "blur(60px)" }} />
        </div>
        <div className="relative max-w-5xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3 leading-tight">
            {tHero("title1")}<br /><span className="gradient-text">{tHero("title2")}</span>
          </h1>
          <p className="text-base text-[#a0a0b0] max-w-xl mx-auto mb-6 leading-relaxed">{tHero("subtitle")}</p>

          {/* Live converter */}
          <EmbeddedConverter onSignIn={() => setShowSignIn(true)} />
          <SocialProof />
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#f0f0f5] mb-4">
              {tFeatures("heading")} <span className="gradient-text">{tFeatures("headingHighlight")}</span>
            </h2>
            <p className="text-[#a0a0b0] text-lg max-w-2xl mx-auto">{tFeatures("subheading")}</p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featureItems.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <FeatureCard icon={f.icon} title={f.title} desc={f.desc} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 px-6" style={{ background: "#111118" }}>
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#f0f0f5] mb-4">
              {tHow("heading1")} <span className="gradient-text">{tHow("heading2")}</span>
            </h2>
            <p className="text-[#a0a0b0] text-lg">{tHow("subheading")}</p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <Reveal key={step.num} delay={i * 120}>
                <div className="relative text-center md:text-left">
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-px -translate-x-8"
                      style={{ background: "linear-gradient(90deg, rgba(139,92,246,0.4) 0%, transparent 100%)" }} />
                  )}
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl font-black text-xl mb-5"
                    style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}>{step.num}</div>
                  <h3 className="font-semibold text-[#f0f0f5] text-lg mb-3">{step.title}</h3>
                  <p className="text-sm text-[#a0a0b0] leading-relaxed">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Designed For You ── */}
      <DesignedForYou />

      {/* ── Testimonials ── */}
      <div style={{ background: "#111118" }}><Testimonials /></div>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#f0f0f5] mb-4">
              {tPricing("heading1")} <span className="gradient-text">{tPricing("heading2")}</span>
            </h2>
            <p className="text-[#a0a0b0] text-lg">{tPricing("subheading")}</p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
            {[
              <PricingCard key="free" name={tPricing("free.name")} price={tPricing("free.price")} desc={tPricing("free.desc")} features={freeFeatures} cta={tPricing("free.cta")} href="/app" />,
              <PricingCard key="monthly" name="Monthly" price="$9.99" period="/mo" desc="Full access, billed monthly" features={proFeatures} cta="Try Free 3 Days" trialBadge="3-day free trial" href={POLAR_MONTHLY_URL} />,
              <PricingCard key="yearly" name="Yearly" price="$79.99" period="/yr" desc="Full access — save 33% vs monthly" features={[...proFeatures, "Save $39.89 vs monthly"]} cta="Try Free 3 Days" trialBadge="3-day free trial" href={POLAR_YEARLY_URL} highlighted badge="Best Value" />,
              <PricingCard key="lifetime" name="Lifetime" price="$149.99" period=" once" desc="Pay once, use forever — no recurring fees" features={[...proFeatures, "No recurring charges ever"]} cta="Get Lifetime Access" href={POLAR_LIFETIME_URL} />,
            ].map((card, i) => <Reveal key={i} delay={i * 80}>{card}</Reveal>)}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6" style={{ background: "#111118" }}>
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#f0f0f5] mb-4">
              {tFaq("heading1")} <span className="gradient-text">{tFaq("heading2")}</span>
            </h2>
          </Reveal>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <Reveal key={item.q} delay={i * 60}>
                <FaqItem q={item.q} a={item.a} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 px-6">
        <Reveal>
          <div className="max-w-4xl mx-auto text-center rounded-3xl p-12 border relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #16102a 0%, #1a1a24 50%, #0d1a12 100%)", borderColor: "rgba(139,92,246,0.3)" }}>
            <div className="absolute inset-0 opacity-30 pointer-events-none"
              style={{ background: "radial-gradient(circle at 50% 0%, rgba(139,92,246,0.3) 0%, transparent 60%)" }} />
            <div className="relative">
              <h2 className="text-4xl font-bold text-[#f0f0f5] mb-4">
                {tCta("heading1")} <span className="gradient-text">{tCta("heading2")}</span>
              </h2>
              <p className="text-[#a0a0b0] text-lg mb-8 max-w-xl mx-auto">{tCta("subheading")}</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={() => setShowSignIn(true)}
                  className="px-8 py-4 rounded-xl font-semibold text-white text-lg transition-all duration-200 hover:opacity-90 hover:shadow-xl hover:shadow-purple-500/30"
                  style={{ background: "#8b5cf6" }}>
                  {tCta("cta1")}
                </button>
                <a href="https://chromewebstore.google.com/detail/mfpcphpkfokoiellglchcegaciljehif?utm_source=item-share-cb" target="_blank" rel="noopener noreferrer"
                  className="px-8 py-4 rounded-xl font-semibold border text-[#a0a0b0] text-lg transition-all duration-200 hover:text-[#f0f0f5] hover:bg-white/5"
                  style={{ borderColor: "rgba(255,255,255,0.15)" }}>
                  {tCta("cta2")}
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-12 px-6" style={{ borderColor: "rgba(255,255,255,0.08)", background: "#111118" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Vid2Podcast" width={28} height={28} className="rounded-lg opacity-80" />
            <span className="text-sm font-semibold text-[#a0a0b0]">Vid2Podcast</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-[#606070] hover:text-[#a0a0b0] transition-colors">{tFooter("privacy")}</Link>
            <a href="mailto:support@vid2podcast.com" className="text-sm text-[#606070] hover:text-[#a0a0b0] transition-colors">{tFooter("support")}</a>
            <a href="https://chromewebstore.google.com/detail/mfpcphpkfokoiellglchcegaciljehif?utm_source=item-share-cb" target="_blank" rel="noopener noreferrer" className="text-sm text-[#606070] hover:text-[#a0a0b0] transition-colors">{tFooter("store")}</a>
          </div>
          <p className="text-xs text-[#606070]">© {new Date().getFullYear()} Vid2Podcast. {tFooter("rights")}</p>
        </div>
      </footer>
    </div>
  );
}

export default function LocalePage() {
  return (
    <Suspense>
      <LandingInner />
    </Suspense>
  );
}
