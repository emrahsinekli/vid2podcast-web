"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useUser } from "@/components/UserProvider";
import { POLAR_BUY_URL, BACKEND_URL, GUEST_TOKEN } from "@/lib/constants";
import { extractVideoId } from "@/lib/utils";

// ─── Sign In Modal ─────────────────────────────────────────────────────────────
function SignInModal({ onClose }: { onClose: () => void }) {
  const { signIn } = useUser();
  const perks = [
    "5 free conversions when you sign up",
    "+1 free credit every day (max 5)",
    "AI summary in 30+ languages",
    "Natural voice playback (TTS)",
    "Full transcript — any video length",
    "Conversion history saved",
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.3)" }}
      >
        {/* Purple gradient bar */}
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa, #8b5cf6, #6366f1)" }} />

        <div className="p-7">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", color: "#606070" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-1">
            <Image src="/logo.png" alt="Vid2Podcast" width={36} height={36} className="rounded-xl" />
            <span className="font-bold text-[#f0f0f5]">Vid2Podcast</span>
          </div>
          <h2 className="text-2xl font-black text-[#f0f0f5] mt-4 mb-1">Get 5 Free Conversions</h2>
          <p className="text-sm text-[#606070] mb-6">No credit card required · Cancel anytime</p>

          {/* Perks */}
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

          {/* Google button */}
          <button
            onClick={signIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-bold text-white transition-all duration-200 hover:opacity-90 hover:shadow-xl hover:shadow-blue-500/20 mb-3"
            style={{ background: "#4285F4" }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google — Free
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

// ─── Embedded Converter ──────────────────────────────────────────────────────────
function EmbeddedConverter({ onSignIn }: { onSignIn: () => void }) {
  const [ytUrl, setYtUrl] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [tab, setTab] = useState<"youtube" | "upload">("youtube");
  const [phase, setPhase] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [loadMsg, setLoadMsg] = useState("");
  const [result, setResult] = useState<{ title: string; transcript: string; guestLimited?: boolean } | null>(null);
  const [error, setError] = useState("");
  const [speaking, setSpeaking] = useState(false);

  const handleSubmit = async () => {
    setPhase("loading");
    setError("");
    try {
      let transcript = "", title = "Video";
      if (tab === "youtube") {
        const videoId = extractVideoId(ytUrl.trim());
        if (!videoId) throw new Error("Invalid YouTube URL. Please paste a youtube.com link.");
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
        if (data.guestLimited) {
          setResult({ title, transcript, guestLimited: true });
          setPhase("done");
          return;
        }
      } else {
        if (!uploadFile) throw new Error("Please select a file.");
        if (uploadFile.size > 4_200_000) throw new Error("File too large. Max 4MB (~4 minutes of MP3).");
        setLoadMsg("Uploading audio...");
        const ab = await uploadFile.arrayBuffer();
        const uploadRes = await fetch(`${BACKEND_URL}/api/upload-transcript`, {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream", "x-v2p-token": GUEST_TOKEN, "x-filename": uploadFile.name },
          body: ab,
        });
        if (!uploadRes.ok) { const e = await uploadRes.json().catch(() => ({})); throw new Error(e.error || "Upload failed"); }
        const { transcriptId } = await uploadRes.json();
        setLoadMsg("Transcribing... ~30-60 seconds");
        let done = false;
        for (let i = 0; i < 40 && !done; i++) {
          await new Promise((r) => setTimeout(r, 3000));
          const pd = await fetch(`${BACKEND_URL}/api/upload-transcript?id=${transcriptId}`, { headers: { "x-v2p-token": GUEST_TOKEN } }).then((r) => r.json());
          if (pd.status === "completed") { transcript = pd.transcript; title = uploadFile.name.replace(/\.[^.]+$/, ""); done = true; }
          else if (pd.status === "error") throw new Error(pd.error || "Transcription failed");
        }
        if (!done) throw new Error("Timed out. Try a shorter file.");
      }
      setResult({ title, transcript });
      setPhase("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setPhase("error");
    }
  };

  const handleSpeak = () => {
    if (!result) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const utter = new SpeechSynthesisUtterance(result.transcript.slice(0, 3000));
    utter.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
    setSpeaking(true);
  };

  const SNIPPET = 500;

  if (phase === "done" && result) {
    const unlockItems = [
      { icon: "🤖", text: "AI summary in 30+ languages" },
      { icon: "🔊", text: "Natural voice playback (TTS)" },
      { icon: "📄", text: "Full transcript — no 5-min limit" },
      { icon: "📜", text: "Conversion history saved" },
    ];
    return (
      <div className="w-full max-w-2xl mx-auto rounded-2xl border overflow-hidden shadow-2xl" style={{ background: "#111118", borderColor: "rgba(139,92,246,0.35)" }}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] text-[#606070] uppercase tracking-wider mb-0.5">Transcript</p>
              <h3 className="text-sm font-semibold text-[#f0f0f5] max-w-xs truncate">{result.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSpeak} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all" style={{ background: speaking ? "#6d28d9" : "#8b5cf6" }}>
                {speaking ? (
                  <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>Stop</>
                ) : (
                  <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>Listen</>
                )}
              </button>
              <button onClick={() => { setPhase("idle"); setResult(null); if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); } }} className="px-3 py-1.5 rounded-lg text-xs text-[#a0a0b0] hover:text-[#f0f0f5] transition-colors" style={{ background: "rgba(255,255,255,0.06)" }}>
                New
              </button>
            </div>
          </div>

          {/* Guest limited warning */}
          {result.guestLimited && (
            <div className="mb-3 px-3.5 py-2.5 rounded-xl flex items-center gap-2 text-xs" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
              <span className="text-yellow-400">⚠</span>
              <span className="text-yellow-300">Showing first ~5 minutes only. Sign up free to get the full transcript.</span>
            </div>
          )}

          <div className="rounded-xl p-4 text-sm text-[#a0a0b0] leading-relaxed overflow-y-auto mb-4" style={{ background: "#0a0a0f", maxHeight: "160px" }}>
            {result.transcript.slice(0, SNIPPET)}
            {result.transcript.length > SNIPPET && (
              <span className="text-[#a78bfa] cursor-pointer ml-1" onClick={onSignIn}>... see full transcript →</span>
            )}
          </div>

          {/* Compelling sign-up CTA */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(139,92,246,0.3)" }}>
            <div className="px-4 py-3" style={{ background: "rgba(139,92,246,0.08)" }}>
              <p className="text-sm font-semibold text-[#f0f0f5] mb-1">🎉 Transcript ready! Sign up to unlock:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2.5">
                {unlockItems.map((item) => (
                  <div key={item.text} className="flex items-center gap-1.5 text-xs text-[#a0a0b0]">
                    <span>{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 py-3" style={{ background: "rgba(139,92,246,0.04)" }}>
              <button
                onClick={onSignIn}
                className="w-full py-2.5 rounded-lg text-sm font-bold text-white hover:opacity-90 transition-all mb-2"
                style={{ background: "#4285F4" }}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" /><path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                  Continue with Google — Get 5 Free Credits
                </span>
              </button>
              <p className="text-center text-[10px] text-[#606070]">No credit card · Takes 10 seconds</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl border overflow-hidden shadow-2xl" style={{ background: "#111118", borderColor: "rgba(139,92,246,0.3)" }}>
      <div className="p-5">
        {/* Input tabs */}
        <div className="flex gap-1.5 mb-4 p-1 rounded-xl" style={{ background: "#1a1a24" }}>
          {[{ id: "youtube", label: "🎬 YouTube URL" }, { id: "upload", label: "📁 Upload File" }].map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id as "youtube" | "upload")}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${tab === id ? "text-white" : "text-[#606070] hover:text-[#a0a0b0]"}`}
              style={tab === id ? { background: "#8b5cf6" } : {}}>
              {label}
            </button>
          ))}
        </div>

        {tab === "youtube" ? (
          <input
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && phase !== "loading" && handleSubmit()}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full px-4 py-3 rounded-xl text-sm mb-4 outline-none transition-all focus:border-[#8b5cf6]"
            style={{ background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.08)", color: "#f0f0f5" }}
          />
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:border-[rgba(139,92,246,0.5)] mb-4"
            style={{ borderColor: uploadFile ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.1)" }}>
            <input type="file" className="hidden" accept=".mp3,.wav,.m4a,.ogg,.webm,.mp4"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
            {uploadFile ? (
              <><span className="text-2xl">🎵</span><span className="text-sm text-[#f0f0f5]">{uploadFile.name}</span><span className="text-xs text-[#606070]">Click to change</span></>
            ) : (
              <><span className="text-2xl">📁</span><span className="text-sm text-[#a0a0b0]">Drop file or click to browse</span><span className="text-xs text-[#606070]">MP3, WAV, M4A, OGG · Max 4MB (~4 min)</span></>
            )}
          </label>
        )}

        {phase === "error" && (
          <div className="mb-4 p-3 rounded-xl text-xs text-red-300" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={phase === "loading" || (tab === "youtube" ? !ytUrl.trim() : !uploadFile)}
          className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" }}
        >
          {phase === "loading" ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {loadMsg || "Processing..."}
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Try Free — No Account Needed
            </>
          )}
        </button>
        <p className="text-center text-xs text-[#606070] mt-2">No credit card · No sign-up · Works instantly</p>
      </div>
    </div>
  );
}

// ─── Stats Counter ────────────────────────────────────────────────────────────────
function StatsCounter() {
  const stats = [
    { label: "Videos Converted", value: 12400, suffix: "+" },
    { label: "Languages Supported", value: 30, suffix: "+" },
    { label: "Chrome Store Rating", value: 4.9, suffix: "★", isFloat: true },
  ];
  const [counts, setCounts] = useState([0, 0, 0]);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const duration = 1500, interval = 25;
    const steps = duration / interval;
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

  return (
    <div className="grid grid-cols-3 gap-6 max-w-sm mx-auto mt-10">
      {stats.map((s, i) => (
        <div key={s.label} className="text-center">
          <div className="text-2xl md:text-3xl font-black text-[#f0f0f5]">{counts[i]}{s.suffix}</div>
          <div className="text-[10px] md:text-xs text-[#606070] mt-0.5 leading-tight">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Designed For You Cards ───────────────────────────────────────────────────
function DesignedForYou() {
  const personas = [
    {
      icon: "🎓",
      label: "Students",
      desc: "Turn lectures into text. Get AI summaries, translate to your language, and study smarter — no more rewinding 2-hour videos.",
      gradient: "linear-gradient(135deg, #1a1040 0%, #16102a 100%)",
      accent: "#8b5cf6",
    },
    {
      icon: "👩‍🏫",
      label: "Educators",
      desc: "Convert teaching material into transcripts, create clear audio lessons, and reach students in any language.",
      gradient: "linear-gradient(135deg, #0d1a2d 0%, #0a1020 100%)",
      accent: "#6366f1",
    },
    {
      icon: "💼",
      label: "Professionals",
      desc: "Turn meetings, webinars, and conference talks into notes, summaries, and shareable text — in minutes.",
      gradient: "linear-gradient(135deg, #1a1520 0%, #111118 100%)",
      accent: "#a78bfa",
    },
    {
      icon: "🔬",
      label: "Researchers",
      desc: "Extract quotes from expert talks and academic videos. Searchable transcripts replace hours of manual note-taking.",
      gradient: "linear-gradient(135deg, #0d1a12 0%, #0a0a0f 100%)",
      accent: "#22c55e",
    },
    {
      icon: "🎙️",
      label: "Creators",
      desc: "Repurpose video content into blog posts, newsletters, episode notes, and social clips — in any language.",
      gradient: "linear-gradient(135deg, #1a0d10 0%, #111118 100%)",
      accent: "#f43f5e",
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-[#f0f0f5] mb-4">Designed for <span className="gradient-text">You</span></h2>
          <p className="text-[#a0a0b0] text-lg">Whatever you do, Vid2Podcast saves you hours every week.</p>
        </div>

        {/* Top row: 2 large cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {personas.slice(0, 2).map((p) => (
            <div key={p.label} className="relative rounded-2xl border p-8 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-default group"
              style={{ background: p.gradient, borderColor: `${p.accent}25` }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                style={{ background: `radial-gradient(circle at 30% 50%, ${p.accent}10 0%, transparent 60%)` }} />
              <div className="text-5xl mb-4">{p.icon}</div>
              <h3 className="text-xl font-bold text-[#f0f0f5] mb-3">{p.label}</h3>
              <p className="text-sm text-[#a0a0b0] leading-relaxed">{p.desc}</p>
              <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: p.accent }}>
                Learn more
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom row: 3 smaller cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {personas.slice(2).map((p) => (
            <div key={p.label} className="relative rounded-2xl border p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-default group"
              style={{ background: p.gradient, borderColor: `${p.accent}25` }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                style={{ background: `radial-gradient(circle at 30% 50%, ${p.accent}10 0%, transparent 60%)` }} />
              <div className="text-4xl mb-3">{p.icon}</div>
              <h3 className="text-lg font-bold text-[#f0f0f5] mb-2">{p.label}</h3>
              <p className="text-xs text-[#a0a0b0] leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function Testimonials() {
  const reviews = [
    {
      name: "Sarah M.",
      role: "Graduate Student",
      initials: "SM",
      color: "#8b5cf6",
      stars: 5,
      text: "I use Vid2Podcast every day for my coursework. Instead of watching 2-hour lectures, I read the transcript and AI summary in 10 minutes. It's changed how I study completely.",
    },
    {
      name: "James K.",
      role: "Marketing Professional",
      initials: "JK",
      color: "#6366f1",
      stars: 5,
      text: "I needed to research competitor content fast. With Vid2Podcast I can read transcripts of dozens of videos in the time it'd take to watch one. The translation feature is a game changer.",
    },
    {
      name: "Priya R.",
      role: "Podcast Creator",
      initials: "PR",
      color: "#f43f5e",
      stars: 5,
      text: "I repurpose YouTube interviews into show notes, newsletters, and social posts using the transcript. What used to take hours now takes minutes. Absolutely worth it.",
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-[#f0f0f5] mb-4">Real Stories, <span className="gradient-text">Real Results</span></h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div key={r.name} className="rounded-2xl border p-6 flex flex-col gap-4" style={{ background: "#111118", borderColor: "rgba(255,255,255,0.08)" }}>
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: r.stars }).map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              {/* Review */}
              <p className="text-sm text-[#a0a0b0] leading-relaxed flex-1">&ldquo;{r.text}&rdquo;</p>
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: r.color }}>
                  {r.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#f0f0f5]">{r.name}</p>
                  <p className="text-xs text-[#606070]">{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
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
    { q: "Is Vid2Podcast really free?", a: "Yes! Sign up free and get 5 conversions immediately, then +1 credit per day. The Pro plan ($9.99 one-time, no subscription) removes all limits." },
    { q: "What YouTube videos does it work with?", a: "Any YouTube video that has captions available — auto-generated or manual. Most videos have auto-generated captions in at least one language." },
    { q: "How does translation work?", a: "We use server-side translation to convert the transcript to your chosen language. The translation preserves meaning and context, not just word-for-word translation." },
    { q: "What's the difference between Free and Pro?", a: "Free gives you 5 conversions on sign-up then +1/day, 2 AI chat messages, and browser TTS. Pro is a one-time payment that unlocks unlimited conversions, unlimited chat, Google Neural2 voices, and priority processing." },
    { q: "Do I need to create an account?", a: "You can try once without an account. Sign up free with Google to get 5 conversion credits and +1 more every day." },
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
              href="https://chromewebstore.google.com/detail/mfpcphpkfokoiellglchcegaciljehif?utm_source=item-share-cb"
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
            <span>Try Free Below — No Account, No Credit Card</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
            Turn Any Video
            <br />
            <span className="gradient-text">Into a Podcast</span>
          </h1>

          <p className="text-xl text-[#a0a0b0] max-w-2xl mx-auto mb-10 leading-relaxed">
            Paste a YouTube URL or upload your own audio/video file. Get instant transcript, AI summary, and natural audio playback in 30+ languages.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <a
              href="https://chromewebstore.google.com/detail/mfpcphpkfokoiellglchcegaciljehif?utm_source=item-share-cb"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-xl hover:shadow-purple-500/30"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" /></svg>
              Add Chrome Extension
            </a>
            <a href="#pricing" className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[#a0a0b0] hover:text-[#f0f0f5] transition-colors text-sm">
              View pricing ↓
            </a>
          </div>

          {/* Live embedded converter */}
          <EmbeddedConverter onSignIn={() => setShowSignIn(true)} />

          <StatsCounter />
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

      {/* ── Designed For You ── */}
      <DesignedForYou />

      {/* ── Testimonials ── */}
      <div style={{ background: "#111118" }}>
        <Testimonials />
      </div>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6" style={{ background: "#111118" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#f0f0f5] mb-4">
              Simple, <span className="gradient-text">honest pricing</span>
            </h2>
            <p className="text-[#a0a0b0] text-lg">No subscriptions. No surprises. Pay once, use forever.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto items-center">
            <PricingCard
              name="Free" price="$0" desc="Start with 5 free conversions"
              features={["5 credits on sign-up · +1/day", "30+ language translation", "Browser TTS voices", "AI summary (limited)", "Transcript download", "2 AI chat messages/day"]}
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
                href="https://chromewebstore.google.com/detail/mfpcphpkfokoiellglchcegaciljehif?utm_source=item-share-cb" target="_blank" rel="noopener noreferrer"
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
              { label: "Chrome Store", href: "https://chromewebstore.google.com/detail/mfpcphpkfokoiellglchcegaciljehif?utm_source=item-share-cb" },
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
