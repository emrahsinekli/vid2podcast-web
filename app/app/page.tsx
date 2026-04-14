"use client";

import { useEffect, useRef, useState } from "react";
import { BACKEND_URL, FREE_CHAT_LIMIT, FREE_LIMIT, FREE_SUMMARY_WORDS, LANGUAGES, POLAR_BUY_URL } from "@/lib/constants";
import { summarize, SummaryType } from "@/lib/summary";
import { extractVideoId } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────────────
type Mode = "full" | "summary" | "podcast";
type Tab = "transcript" | "summary" | "chat";
type ChatMessage = { role: "user" | "assistant"; text: string };

interface ConversionResult {
  videoId: string;
  title: string;
  author: string;
  transcript: string;
}

// ─── Pro Wall Modal ──────────────────────────────────────────────────────────
function ProWallModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border p-8 shadow-2xl" style={{ background: "#111118", borderColor: "rgba(139,92,246,0.3)" }}>
        <button onClick={onClose} className="absolute right-4 top-4 text-[#606070] hover:text-[#f0f0f5] transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(139,92,246,0.15)" }}>
            <svg className="w-8 h-8 text-[#8b5cf6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#f0f0f5] mb-2">Pro Feature</h2>
          <p className="text-[#a0a0b0] mb-6 text-sm leading-relaxed">
            Google Neural2 voices are available on the Pro plan. Upgrade once, use forever — no subscription needed.
          </p>
          <ul className="text-left space-y-2.5 mb-8">
            {["Google Neural2 high-quality voices", "Unlimited conversions", "Unlimited AI chat", "All summary types"].map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-[#a0a0b0]">
                <svg className="w-4 h-4 text-[#22c55e] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <a
            href={POLAR_BUY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 rounded-xl font-semibold text-white text-center transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/25"
            style={{ background: "#8b5cf6" }}
          >
            Upgrade to Pro — $9.99
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Loading Orb ────────────────────────────────────────────────────────────
function LoadingOrb() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: "#8b5cf6" }} />
        <div className="absolute inset-2 rounded-full animate-pulse" style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" }} />
        <div className="absolute inset-5 rounded-full bg-[#0a0a0f]" />
        <div className="absolute inset-6 rounded-full animate-spin" style={{ border: "2px solid transparent", borderTopColor: "#a78bfa" }} />
      </div>
      <p className="text-[#a0a0b0] text-sm animate-pulse">Fetching transcript...</p>
    </div>
  );
}

// ─── Audio Player ────────────────────────────────────────────────────────────
function AudioPlayer({
  transcript,
  isPro,
  langBcp47,
  onProWall,
}: {
  transcript: string;
  isPro: boolean;
  langBcp47: string;
  onProWall: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [generating, setGenerating] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    return () => {
      synthRef.current?.cancel();
    };
  }, []);

  const handleGenerate = () => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    setGenerating(true);
    setTimeout(() => {
      const utter = new SpeechSynthesisUtterance(transcript.slice(0, 5000));
      utter.rate = speed;
      if (langBcp47) utter.lang = langBcp47;
      utter.onstart = () => { setPlaying(true); setGenerating(false); };
      utter.onend = () => { setPlaying(false); setProgress(100); };
      utter.onboundary = (e) => {
        const pct = Math.min(100, Math.round((e.charIndex / transcript.length) * 100));
        setProgress(pct);
      };
      utterRef.current = utter;
      synthRef.current!.speak(utter);
    }, 300);
  };

  const handlePlayPause = () => {
    if (!synthRef.current) return;
    if (playing) {
      synthRef.current.pause();
      setPlaying(false);
    } else if (synthRef.current.paused) {
      synthRef.current.resume();
      setPlaying(true);
    } else {
      handleGenerate();
    }
  };

  const handleGenerateNeural = () => {
    if (!isPro) { onProWall(); return; }
    handleGenerate();
  };

  const speeds = [0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="rounded-2xl border p-5" style={{ background: "#111118", borderColor: "rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
        <span className="text-sm font-medium text-[#f0f0f5]">Audio Player</span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 rounded-full mb-4 overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
          style={{ width: `${progress}%`, background: "linear-gradient(90deg, #8b5cf6, #a78bfa)" }}
        />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Play/Pause */}
        <button
          onClick={handlePlayPause}
          disabled={generating}
          className="flex items-center justify-center w-10 h-10 rounded-full text-white transition-all duration-200 hover:scale-105 disabled:opacity-50"
          style={{ background: "#8b5cf6" }}
        >
          {generating ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : playing ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Speed selector */}
        <div className="flex items-center gap-1">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => {
                setSpeed(s);
                if (utterRef.current) utterRef.current.rate = s;
              }}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${speed === s ? "text-white" : "text-[#606070] hover:text-[#a0a0b0]"}`}
              style={speed === s ? { background: "rgba(139,92,246,0.3)", color: "#a78bfa" } : {}}
            >
              {s}x
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleGenerate}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#a0a0b0] border transition-all duration-150 hover:bg-white/5"
            style={{ borderColor: "rgba(255,255,255,0.12)" }}
          >
            Browser TTS
          </button>
          <button
            onClick={handleGenerateNeural}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 hover:opacity-90"
            style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)" }}
          >
            {!isPro && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </svg>
            )}
            Neural2 TTS
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ConverterPage() {
  const { user, profile, isPro } = useUser();

  // Input state
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<Mode>("full");
  const [language, setLanguage] = useState("original");

  // Loading / result
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ConversionResult | null>(null);

  // Tabs
  const [tab, setTab] = useState<Tab>("transcript");

  // Summary
  const [summaryType, setSummaryType] = useState<SummaryType>("descriptive");

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Pro wall
  const [showProWall, setShowProWall] = useState(false);

  // Misc
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const getToken = async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };

  const handleConvert = async () => {
    const videoId = extractVideoId(url.trim());
    if (!videoId) {
      setError("Please enter a valid YouTube URL or video ID.");
      return;
    }

    // Free limit check
    if (!isPro) {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase
        .from("conversions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user?.id ?? "")
        .gte("created_at", today);

      if ((count ?? 0) >= FREE_LIMIT) {
        setError(`Free plan allows ${FREE_LIMIT} conversion per day. Upgrade to Pro for unlimited access.`);
        return;
      }
    }

    setLoading(true);
    setError("");
    setResult(null);
    setChatMessages([]);

    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/transcript`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ videoId, language: language === "original" ? null : language }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? `Server error: ${res.status}`);
      }

      const data = await res.json();
      const convResult: ConversionResult = {
        videoId,
        title: data.title ?? "YouTube Video",
        author: data.author ?? "Unknown",
        transcript: data.transcript ?? "",
      };
      setResult(convResult);
      setTab("transcript");

      // Save conversion
      if (user) {
        const supabase = createClient();
        await supabase.from("conversions").insert({
          user_id: user.id,
          video_id: videoId,
          title: convResult.title,
          language: language === "original" ? "original" : language,
        });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch transcript. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.transcript], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${result.title.slice(0, 40).replace(/[^a-z0-9]/gi, "_")}_transcript.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleChat = async () => {
    if (!chatInput.trim() || !result) return;

    if (!isPro && chatMessages.filter((m) => m.role === "user").length >= FREE_CHAT_LIMIT) {
      setShowProWall(true);
      return;
    }

    const question = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: question }]);
    setChatLoading(true);

    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ question, transcript: result.transcript }),
      });

      if (!res.ok) throw new Error("Chat request failed");
      const data = await res.json();
      setChatMessages((prev) => [...prev, { role: "assistant", text: data.answer ?? "I could not find an answer." }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const selectedLang = LANGUAGES.find((l) => l.code === language);
  const summaryText = result
    ? summarize(result.transcript, {
        type: summaryType,
        wordCount: isPro ? 500 : FREE_SUMMARY_WORDS,
      })
    : "";

  const summaryTypes: { value: SummaryType; label: string }[] = [
    { value: "descriptive", label: "Descriptive" },
    { value: "keypoints", label: "Key Points" },
    { value: "tldr", label: "TL;DR" },
    { value: "notes", label: "Notes" },
    { value: "thread", label: "Thread" },
  ];

  const modes: { value: Mode; label: string; desc: string }[] = [
    { value: "full", label: "Full", desc: "Complete transcript" },
    { value: "summary", label: "Summary", desc: "Key ideas only" },
    { value: "podcast", label: "Podcast", desc: "Audio-first format" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 2px; }
      `}</style>

      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f0f0f5] mb-1">Convert YouTube Video</h1>
        <p className="text-sm text-[#606070]">Paste a YouTube URL to get transcript, summary, and audio</p>
      </div>

      {/* ── Input Card ── */}
      <div className="rounded-2xl border p-6 mb-6" style={{ background: "#111118", borderColor: "rgba(255,255,255,0.08)" }}>
        {/* URL Input */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-[#a0a0b0] mb-2 uppercase tracking-wider">YouTube URL</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <svg className="w-4 h-4 text-[#606070]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
                </svg>
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleConvert()}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-[#f0f0f5] placeholder-[#606070] border outline-none focus:border-[#8b5cf6] transition-colors"
                style={{ background: "#0a0a0f", borderColor: "rgba(255,255,255,0.1)" }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {/* Mode selector */}
          <div>
            <label className="block text-xs font-medium text-[#a0a0b0] mb-2 uppercase tracking-wider">Mode</label>
            <div className="flex gap-1.5">
              {modes.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  title={m.desc}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${mode === m.value ? "text-white" : "text-[#606070] hover:text-[#a0a0b0]"}`}
                  style={mode === m.value ? { background: "#8b5cf6" } : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language selector */}
          <div>
            <label className="block text-xs font-medium text-[#a0a0b0] mb-2 uppercase tracking-wider">Language</label>
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full py-2.5 pl-3 pr-8 rounded-xl text-sm text-[#f0f0f5] border outline-none focus:border-[#8b5cf6] transition-colors appearance-none"
                style={{ background: "#0a0a0f", borderColor: "rgba(255,255,255,0.1)" }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-[#606070]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl mb-4 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Convert Button */}
        <button
          onClick={handleConvert}
          disabled={loading || !url.trim()}
          className="w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" }}
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Convert to Podcast
            </>
          )}
        </button>
      </div>

      {/* ── Loading State ── */}
      {loading && <LoadingOrb />}

      {/* ── Result ── */}
      {result && !loading && (
        <div className="space-y-5">
          {/* Video info */}
          <div className="flex items-start gap-4 rounded-2xl border p-4" style={{ background: "#111118", borderColor: "rgba(255,255,255,0.08)" }}>
            <img
              src={`https://img.youtube.com/vi/${result.videoId}/mqdefault.jpg`}
              alt={result.title}
              className="w-24 h-16 object-cover rounded-lg flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-[#f0f0f5] text-sm leading-snug mb-1 line-clamp-2">{result.title}</h2>
              <p className="text-xs text-[#606070]">{result.author}</p>
              {selectedLang && language !== "original" && (
                <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}>
                  {selectedLang.flag} {selectedLang.label}
                </span>
              )}
            </div>
          </div>

          {/* Audio Player */}
          <AudioPlayer
            transcript={result.transcript}
            isPro={isPro}
            langBcp47={selectedLang?.bcp47 ?? ""}
            onProWall={() => setShowProWall(true)}
          />

          {/* Tabs */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: "#111118", borderColor: "rgba(255,255,255,0.08)" }}>
            {/* Tab bar */}
            <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              {(["transcript", "summary", "chat"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-3 text-sm font-medium capitalize transition-all duration-150 ${tab === t ? "text-[#a78bfa] border-b-2" : "text-[#606070] hover:text-[#a0a0b0]"}`}
                  style={tab === t ? { borderBottomColor: "#8b5cf6" } : {}}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* ── Transcript Tab ── */}
            {tab === "transcript" && (
              <div className="p-5">
                <div
                  className="h-72 overflow-y-auto rounded-xl p-4 text-sm text-[#a0a0b0] leading-relaxed mb-4 scrollbar-thin"
                  style={{ background: "#0a0a0f" }}
                >
                  {result.transcript || "No transcript available."}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#a0a0b0] border transition-all duration-150 hover:bg-white/5"
                    style={{ borderColor: "rgba(255,255,255,0.12)" }}
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#a0a0b0] border transition-all duration-150 hover:bg-white/5"
                    style={{ borderColor: "rgba(255,255,255,0.12)" }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download TXT
                  </button>
                </div>
              </div>
            )}

            {/* ── Summary Tab ── */}
            {tab === "summary" && (
              <div className="p-5">
                {/* Summary type selector */}
                <div className="flex gap-1.5 mb-4 flex-wrap">
                  {summaryTypes.map((st) => (
                    <button
                      key={st.value}
                      onClick={() => setSummaryType(st.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${summaryType === st.value ? "text-white" : "text-[#606070] hover:text-[#a0a0b0]"}`}
                      style={summaryType === st.value ? { background: "#8b5cf6" } : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {!isPro && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-xs" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" }}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Free plan: summary limited to {FREE_SUMMARY_WORDS} words.{" "}
                    <a href={POLAR_BUY_URL} className="underline font-medium">Upgrade for full summaries</a>
                  </div>
                )}

                <div
                  className="h-72 overflow-y-auto rounded-xl p-4 text-sm text-[#a0a0b0] leading-relaxed whitespace-pre-wrap scrollbar-thin"
                  style={{ background: "#0a0a0f" }}
                >
                  {summaryText || "No content to summarize."}
                </div>
              </div>
            )}

            {/* ── Chat Tab ── */}
            {tab === "chat" && (
              <div className="p-5">
                {!isPro && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-xs" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" }}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                    </svg>
                    {chatMessages.filter((m) => m.role === "user").length}/{FREE_CHAT_LIMIT} messages used on Free plan.{" "}
                    <a href={POLAR_BUY_URL} className="underline font-medium">Upgrade for unlimited chat</a>
                  </div>
                )}

                {/* Messages */}
                <div
                  className="h-64 overflow-y-auto mb-4 space-y-3 scrollbar-thin"
                  style={{ paddingRight: "4px" }}
                >
                  {chatMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(139,92,246,0.15)" }}>
                        <svg className="w-5 h-5 text-[#8b5cf6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <p className="text-sm text-[#606070]">Ask anything about this video</p>
                      <p className="text-xs text-[#606070] mt-1 opacity-70">The AI uses the transcript to answer your questions</p>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "assistant" && (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(139,92,246,0.2)" }}>
                          <svg className="w-3.5 h-3.5 text-[#8b5cf6]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5 2.5 2.5 0 0 0 7.5 18 2.5 2.5 0 0 0 10 15.5 2.5 2.5 0 0 0 7.5 13m9 0A2.5 2.5 0 0 0 14 15.5a2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5 2.5 2.5 0 0 0-2.5-2.5z" />
                          </svg>
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "text-white rounded-tr-sm" : "text-[#a0a0b0] rounded-tl-sm"}`}
                        style={msg.role === "user" ? { background: "#8b5cf6" } : { background: "rgba(255,255,255,0.05)" }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(139,92,246,0.2)" }}>
                        <svg className="w-3.5 h-3.5 text-[#8b5cf6]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5 2.5 2.5 0 0 0 7.5 18 2.5 2.5 0 0 0 10 15.5 2.5 2.5 0 0 0 7.5 13m9 0A2.5 2.5 0 0 0 14 15.5a2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5 2.5 2.5 0 0 0-2.5-2.5z" />
                        </svg>
                      </div>
                      <div className="flex gap-1 px-3 py-2 rounded-2xl rounded-tl-sm" style={{ background: "rgba(255,255,255,0.05)" }}>
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#606070] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !chatLoading && handleChat()}
                    placeholder="Ask about this video..."
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm text-[#f0f0f5] placeholder-[#606070] border outline-none focus:border-[#8b5cf6] transition-colors"
                    style={{ background: "#0a0a0f", borderColor: "rgba(255,255,255,0.1)" }}
                  />
                  <button
                    onClick={handleChat}
                    disabled={chatLoading || !chatInput.trim()}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all duration-150 hover:opacity-90 disabled:opacity-40"
                    style={{ background: "#8b5cf6" }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Pro Wall Modal ── */}
      {showProWall && <ProWallModal onClose={() => setShowProWall(false)} />}
    </div>
  );
}
