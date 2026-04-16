"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BACKEND_URL, FREE_CHAT_LIMIT, FREE_LIMIT, FREE_SUMMARY_WORDS, LANGUAGES, POLAR_BUY_URL, POLAR_MONTHLY_URL, POLAR_YEARLY_URL, POLAR_LIFETIME_URL } from "@/lib/constants";
import { summarize, SummaryType } from "@/lib/summary";
import { freeAISummarize, freeAIAnswer, canUseAI } from "@/lib/free-ai";
import { extractVideoId, extractPlaylistId, parseInputUrls } from "@/lib/utils";
import { useUser } from "@/components/UserProvider";
import { createClient } from "@/supabase/client";

// ─── IndexedDB Audio Cache ───────────────────────────────────────────────────
const IDB_NAME = "v2p_audio";
const IDB_STORE = "blobs";

function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<Blob | null> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}

async function idbSet(key: string, blob: Blob): Promise<void> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch { /* silently fail */ }
}

// ─── Types ───────────────────────────────────────────────────────────────────
type Mode = "full" | "summary" | "podcast";
type Tab = "transcript" | "summary" | "chat";
type ChatMessage = { role: "user" | "assistant"; text: string };
type QueueStatus = "pending" | "fetching" | "translating" | "done" | "error";
interface QueueItem {
  videoId: string;
  title: string;
  thumbnail: string;
  status: QueueStatus;
  result?: ConversionResult;
  error?: string;
}
interface PlaylistVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration?: string;
  selected: boolean;
}

interface TranscriptSegment {
  t: number;  // start time in seconds
  text: string;
}

interface ConversionResult {
  videoId: string;
  title: string;
  author: string;
  transcript: string;
  segments: TranscriptSegment[]; // real YouTube timestamps
}

// ─── Pro Wall Modal ──────────────────────────────────────────────────────────
function ProWallModal({ onClose, reason }: { onClose: () => void; reason?: "limit" | "feature" }) {
  const plans = [
    { label: "Monthly", price: "$9.99", period: "/mo", url: POLAR_MONTHLY_URL, highlight: false },
    { label: "Yearly", price: "$6.67", period: "/mo", badge: "Save 33%", url: POLAR_YEARLY_URL, highlight: true },
    { label: "Lifetime", price: "$149", period: " once", badge: "Best Value", url: POLAR_LIFETIME_URL, highlight: false },
  ];
  const features = [
    { icon: "🎙️", text: "Google Neural2 natural voices" },
    { icon: "♾️", text: "Unlimited conversions per day" },
    { icon: "🤖", text: "Unlimited AI chat & summaries" },
    { icon: "🌍", text: "50+ language translation" },
    { icon: "⬇️", text: "MP3 download for every podcast" },
    { icon: "📜", text: "Full history — 365 days" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden" style={{ background: "var(--bg2)", border: "1px solid rgba(139,92,246,0.25)", maxHeight: "92vh", overflowY: "auto" }}>
        {/* Purple glow top bar */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #7c6ef5, #c084fc, #7c6ef5)" }} />

        <div className="p-5 sm:p-7">
          {/* Close */}
          <button onClick={onClose} className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors" style={{ background: "var(--bg3)", color: "var(--text3)" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="text-center mb-5">
            {reason === "limit" ? (
              <>
                <div className="text-3xl mb-2">🚀</div>
                <h2 className="text-xl font-bold text-[var(--text)] mb-1">You've hit today's limit</h2>
                <p className="text-sm text-[var(--text2)]">Free plan: <strong>1 conversion/day</strong>. Upgrade to convert unlimited videos.</p>
              </>
            ) : (
              <>
                <div className="text-3xl mb-2">⚡</div>
                <h2 className="text-xl font-bold text-[var(--text)] mb-1">Unlock Pro Features</h2>
                <p className="text-sm text-[var(--text2)]">Take your podcast experience to the next level.</p>
              </>
            )}
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {features.map((f) => (
              <div key={f.text} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[var(--text2)]" style={{ background: "var(--bg3)" }}>
                <span className="text-base flex-shrink-0">{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Pricing plans */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {plans.map((p) => (
              <a
                key={p.label}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex flex-col items-center justify-center py-3 px-2 rounded-xl text-center transition-all duration-200 hover:scale-[1.03] hover:shadow-lg"
                style={p.highlight
                  ? { background: "linear-gradient(135deg, #7c6ef5 0%, #5b4fe0 100%)", border: "2px solid #a78bfa", color: "#fff", boxShadow: "0 4px 20px rgba(124,110,245,0.35)" }
                  : { background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)" }
                }
              >
                {p.badge && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{ background: p.highlight ? "#fbbf24" : "rgba(124,110,245,0.9)", color: p.highlight ? "#000" : "#fff" }}>
                    {p.badge}
                  </span>
                )}
                <span className="text-[10px] font-semibold opacity-70 mb-0.5">{p.label}</span>
                <span className="text-lg font-bold leading-tight">{p.price}</span>
                <span className="text-[10px] opacity-60">{p.period}</span>
              </a>
            ))}
          </div>

          {/* CTA */}
          <a
            href={POLAR_YEARLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/30"
            style={{ background: "linear-gradient(135deg, #7c6ef5 0%, #5b4fe0 100%)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Get Pro — Start at $6.67/mo
          </a>
          <p className="text-center text-[10px] text-[var(--text3)] mt-2">No risk · Cancel anytime · Instant access</p>
        </div>
      </div>
    </div>
  );
}

// ─── Loading Orb ────────────────────────────────────────────────────────────
function LoadingOrb({ msg }: { msg?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: "#8b5cf6" }} />
        <div className="absolute inset-2 rounded-full animate-pulse" style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" }} />
        <div className="absolute inset-5 rounded-full bg-[var(--bg)]" />
        <div className="absolute inset-6 rounded-full animate-spin" style={{ border: "2px solid transparent", borderTopColor: "#a78bfa" }} />
      </div>
      <p className="text-[var(--text2)] text-sm animate-pulse">{msg ?? "Fetching transcript..."}</p>
    </div>
  );
}

const WEB_TTS_TOKEN = "v2p-web-2024-yL7nQ2pS";

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

// Exactly like extension's smartSplitText: speaker-split first, then 30-word chunks
function smartSplitText(text: string): TranscriptSegment[] {
  const totalWords = text.split(/\s+/).length;
  const segments: TranscriptSegment[] = [];
  const speakerRegex = /([A-Z][A-Za-z\u00C0-\u017E]*(?:\s[A-Z][A-Za-z\u00C0-\u017E]*)*):\s/g;
  const speakerPositions: { idx: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = speakerRegex.exec(text)) !== null) speakerPositions.push({ idx: m.index });

  if (speakerPositions.length >= 2) {
    if (speakerPositions[0].idx > 0) {
      const pre = text.slice(0, speakerPositions[0].idx).trim();
      if (pre) segments.push({ t: 0, text: pre });
    }
    for (let i = 0; i < speakerPositions.length; i++) {
      const start = speakerPositions[i].idx;
      const end = i + 1 < speakerPositions.length ? speakerPositions[i + 1].idx : text.length;
      const chunk = text.slice(start, end).trim();
      if (!chunk) continue;
      const wordsBefore = text.slice(0, start).split(/\s+/).length;
      const sec = Math.floor((wordsBefore / totalWords) * (totalWords / 2.5));
      segments.push({ t: sec, text: chunk });
    }
    return segments;
  }

  // No speakers → 30-word chunks with proportional time estimate
  const words = text.split(/\s+/);
  let i = 0;
  while (i < words.length) {
    let end = Math.min(i + 30, words.length);
    if (end < words.length) {
      for (let j = end; j > i + 18; j--) {
        if (/[.!?]$/.test(words[j - 1])) { end = j; break; }
      }
    }
    const sec = Math.floor((i / totalWords) * (totalWords / 2.5));
    segments.push({ t: sec, text: words.slice(i, end).join(" ") });
    i = end;
  }
  return segments;
}

// Highlight speaker names ("Chris Anderson:", "CA:") with distinct colors
const SPEAKER_COLORS = ["#818cf8", "#f472b6", "#34d399", "#fbbf24", "#fb923c", "#a78bfa", "#22d3ee", "#f87171"];
function renderWithSpeakers(text: string): React.ReactNode {
  const colorMap = new Map<string, string>();
  let ci = 0;
  const parts: React.ReactNode[] = [];
  const re = /([A-Z][A-Za-z\u00C0-\u017E]*(?:\s[A-Z][A-Za-z\u00C0-\u017E]*)*):\s/g;
  let last = 0, match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const name = match[1];
    if (!colorMap.has(name)) { colorMap.set(name, SPEAKER_COLORS[ci % SPEAKER_COLORS.length]); ci++; }
    parts.push(<span key={match.index} className="font-semibold" style={{ color: colorMap.get(name) }}>{name}:{" "}</span>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 1 ? <>{parts}</> : text;
}

const _enc = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;
function byteLen(s: string) { return _enc ? _enc.encode(s).length : s.length; }

function splitTextForTTS(text: string, maxBytes = 4500): string[] {
  const chunks: string[] = [];
  let remaining = text.replace(/\s+/g, " ").trim();
  while (byteLen(remaining) > maxBytes) {
    // Binary search for safe cut point within byte limit
    let lo = 0, hi = remaining.length;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (byteLen(remaining.slice(0, mid)) <= maxBytes) lo = mid; else hi = mid;
    }
    // Try to cut at sentence/word boundary
    let cut = remaining.lastIndexOf(". ", lo);
    if (cut < lo / 2) cut = remaining.lastIndexOf("، ", lo); // Arabic comma
    if (cut < lo / 2) cut = remaining.lastIndexOf(", ", lo);
    if (cut < lo / 2) cut = remaining.lastIndexOf(" ", lo);
    if (cut <= 0) cut = lo;
    chunks.push(remaining.slice(0, cut + 1).trim());
    remaining = remaining.slice(cut + 1).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

// ─── Audio Player ────────────────────────────────────────────────────────────
function AudioPlayer({
  transcript,
  segments,
  realTimestamps,
  isPro,
  langBcp47,
  title,
  gender,
  onProWall,
  onSegmentChange,
  seekToSegmentRef,
  generateTrigger,
  cacheKey,
}: {
  transcript: string;
  segments: { t: number; text: string }[];
  realTimestamps: boolean;  // true = real YouTube timestamps, false = smartSplit estimates
  isPro: boolean;
  langBcp47: string;
  title?: string;
  gender?: string;
  onProWall: () => void;
  onSegmentChange?: (segIdx: number) => void;
  seekToSegmentRef?: React.MutableRefObject<((segIdx: number) => void) | null>;
  generateTrigger?: number;
  cacheKey?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [loop, setLoop] = useState(false);
  const prevTranscriptRef = useRef(transcript);

  // Reset when transcript changes (new video loaded)
  useEffect(() => {
    if (prevTranscriptRef.current === transcript) return;
    prevTranscriptRef.current = transcript;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    setPlaying(false);
    setElapsed(0);
    setDuration(0);
    setGenProgress(0);
  }, [transcript]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-generate audio when triggered (convert button or history open)
  useEffect(() => {
    if (!generateTrigger || !transcript || generating) return;
    // Small delay to let React flush state (transcript + trigger set in same batch)
    const t = setTimeout(async () => {
      // If audio already loaded for this transcript, skip
      if (audioRef.current?.src && audioRef.current.src !== window.location.href) return;
      // Check IDB cache first
      if (cacheKey) {
        const cached = await idbGet(cacheKey);
        if (cached) {
          const url = URL.createObjectURL(cached);
          setAudioUrl(url);
          if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.playbackRate = speed;
            audioRef.current.load();
          }
          return;
        }
      }
      generateAudio().then((url) => {
        if (audioRef.current && url) {
          audioRef.current.src = url;
          audioRef.current.playbackRate = speed;
          audioRef.current.load();
        }
      }).catch(console.error);
    }, 100);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generateTrigger, transcript]);

  const generateAudio = async (): Promise<string> => {
    setGenerating(true);
    setGenProgress(0);
    const maxChars = isPro ? 25000 : 8000;
    const textToUse = transcript.slice(0, maxChars);
    const chunks = splitTextForTTS(textToUse, 4500);
    const buffers: ArrayBuffer[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const res = await fetch(`${BACKEND_URL}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-v2p-token": WEB_TTS_TOKEN },
        body: JSON.stringify({ text: chunks[i], lang: langBcp47 || "en-US", gender: gender || "female" }),
      });
      if (!res.ok) throw new Error("Audio generation failed");
      buffers.push(await res.arrayBuffer());
      setGenProgress(Math.round(((i + 1) / chunks.length) * 100));
    }
    // Concatenate all MP3 chunks into one blob
    const total = buffers.reduce((s, b) => s + b.byteLength, 0);
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const buf of buffers) { merged.set(new Uint8Array(buf), offset); offset += buf.byteLength; }
    const blob = new Blob([merged], { type: "audio/mpeg" });
    // Save to IDB cache for future history loads
    if (cacheKey) idbSet(cacheKey, blob);
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    setGenerating(false);
    return url;
  };

  const handlePlayPause = async () => {
    if (generating) return;
    try {
      let url = audioUrl;
      if (!url) {
        url = await generateAudio();
        if (audioRef.current && url) {
          audioRef.current.src = url;
          audioRef.current.playbackRate = speed;
          audioRef.current.load();
          await audioRef.current.play();
        }
        return;
      }
      if (!audioRef.current) return;
      if (playing) audioRef.current.pause();
      else await audioRef.current.play();
    } catch (e) {
      console.error("Audio error:", e);
      setGenerating(false);
    }
  };

  // Precompute cumulative char offsets for char-based sync (TTS audio has no YouTube timestamps)
  const segCharOffsets = useMemo(() => {
    const offsets: number[] = [];
    let cum = 0;
    for (const seg of segments) { offsets.push(cum); cum += seg.text.length; }
    offsets.push(cum); // sentinel
    return offsets;
  }, [segments]);

  const activeSegFromTime = (cur: number, dur: number): number => {
    if (!segments.length || dur <= 0) return 0;
    const totalChars = segCharOffsets[segCharOffsets.length - 1];
    if (totalChars === 0) return Math.min(Math.floor((cur / dur) * segments.length), segments.length - 1);
    const targetChars = (cur / dur) * totalChars;
    let lo = 0, hi = segments.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (segCharOffsets[mid] <= targetChars) lo = mid; else hi = mid - 1;
    }
    return lo;
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const cur = audio.currentTime;
    const dur = audio.duration || 0;
    setElapsed(cur);
    setDuration(dur);
    if (segments.length > 0 && dur > 0) {
      onSegmentChange?.(activeSegFromTime(cur, dur));
    }
  };

  const seekFromClientX = (clientX: number, rect: DOMRect) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = Math.max(0, Math.min((clientX - rect.left) / rect.width * duration, duration));
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    seekFromClientX(e.clientX, e.currentTarget.getBoundingClientRect());
  };

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    seekFromClientX(e.clientX, e.currentTarget.getBoundingClientRect());
  };

  const handleProgressTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const touch = e.touches[0] || e.changedTouches[0];
    if (!touch) return;
    seekFromClientX(touch.clientX, e.currentTarget.getBoundingClientRect());
  };

  const seekToSegment = (segIdx: number) => {
    const audio = audioRef.current;
    if (!audio || !segments.length || !duration) return;
    const totalChars = segCharOffsets[segCharOffsets.length - 1];
    const ratio = totalChars > 0 ? segCharOffsets[segIdx] / totalChars : segIdx / segments.length;
    audio.currentTime = Math.min(ratio * duration, duration - 0.1);
    if (!playing) audio.play().catch(() => {});
  };

  useEffect(() => {
    if (seekToSegmentRef) seekToSegmentRef.current = seekToSegment;
  });

  const skip = (secs: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.currentTime + secs, duration));
  };

  const progress = duration > 0 ? (elapsed / duration) * 100 : 0;
  const isTruncated = !isPro && transcript.length > 8000;

  return (
    <div className="rounded-2xl border p-5" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          if (loop && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
          } else {
            setPlaying(false);
          }
        }}
        style={{ display: "none" }}
      />

      {/* Header row */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${playing ? "bg-[#22c55e] animate-pulse" : generating ? "bg-[#8b5cf6] animate-pulse" : "bg-[var(--text3)]"}`} />
        <span className="text-sm font-medium text-[var(--text)]">Podcast Audio</span>
        <div className="ml-auto flex items-center gap-2">
          {generating && (
            <span className="text-xs text-[#8b5cf6] animate-pulse">{genProgress}% generating…</span>
          )}
          {duration > 0 && (
            <span className="text-xs font-mono" style={{ color: "var(--text2)" }}>
              {fmtTime(elapsed)} / {fmtTime(duration)}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar — clickable + draggable + touch */}
      <div
        className="relative h-4 rounded-full mb-4 cursor-pointer group touch-none"
        style={{ background: "var(--border)" }}
        onClick={handleProgressClick}
        onMouseMove={handleProgressDrag}
        onTouchStart={handleProgressTouch}
        onTouchMove={handleProgressTouch}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${progress}%`, background: "linear-gradient(90deg, #8b5cf6, #a78bfa)", transition: duration > 0 ? "width 0.2s linear" : "none" }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 8px)`, pointerEvents: "none" }}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3">
        {/* Row 1: back / play / fwd / loop / speed-toggle / volume */}
        <div className="flex items-center gap-1.5">
          {/* Back 15s */}
          <button onClick={() => skip(-15)} disabled={!audioUrl} title="Back 15s"
            className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--text3)] hover:text-[var(--text2)] disabled:opacity-30 transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
            </svg>
          </button>

          {/* Play / Pause */}
          <button onClick={handlePlayPause} disabled={generating}
            className="flex items-center justify-center w-11 h-11 rounded-full text-white transition-all duration-200 hover:scale-105 disabled:opacity-50 flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" }}>
            {generating ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : playing ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            ) : (
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>

          {/* Forward 15s */}
          <button onClick={() => skip(15)} disabled={!audioUrl} title="Forward 15s"
            className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--text3)] hover:text-[var(--text2)] disabled:opacity-30 transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 13c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6v4l5-5-5-5v4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8h-2z" />
            </svg>
          </button>

          {/* Loop toggle */}
          <button
            onClick={() => setLoop((l) => !l)}
            title={loop ? "Loop on" : "Loop off"}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
            style={loop ? { color: "#a78bfa", background: "rgba(139,92,246,0.15)" } : { color: "var(--text3)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Speed — desktop: inline buttons; mobile: single toggle button */}
          <div className="relative">
            {/* Mobile: single button showing current speed */}
            <button
              onClick={() => setSpeedOpen((o) => !o)}
              className="sm:hidden w-9 h-9 flex items-center justify-center rounded-full text-[10px] font-bold transition-colors"
              style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}
            >
              {speed}x
            </button>
            {/* Mobile speed dropdown */}
            {speedOpen && (
              <div className="sm:hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex flex-col gap-1 rounded-xl border p-1.5 z-10 shadow-lg"
                style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
                {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                  <button key={s}
                    onClick={() => { setSpeed(s); if (audioRef.current) audioRef.current.playbackRate = s; setSpeedOpen(false); }}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={speed === s ? { background: "rgba(139,92,246,0.3)", color: "#a78bfa" } : { color: "var(--text2)" }}>
                    {s}x
                  </button>
                ))}
              </div>
            )}
            {/* Desktop: inline speed buttons */}
            <div className="hidden sm:flex items-center gap-0.5">
              {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                <button key={s}
                  onClick={() => { setSpeed(s); if (audioRef.current) audioRef.current.playbackRate = s; }}
                  className={`px-1.5 py-0.5 rounded-md text-[11px] font-medium transition-all duration-150 ${speed === s ? "" : "text-[var(--text3)] hover:text-[var(--text2)]"}`}
                  style={speed === s ? { background: "rgba(139,92,246,0.3)", color: "#a78bfa" } : {}}>
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Volume — takes remaining space */}
          <div className="flex items-center gap-1.5 flex-1 ml-1">
            <button
              onClick={() => { const v = volume > 0 ? 0 : 1; setVolume(v); if (audioRef.current) audioRef.current.volume = v; }}
              className="text-[var(--text3)] hover:text-[var(--text2)] transition-colors flex-shrink-0"
            >
              {volume === 0 ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : volume < 0.5 ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 12M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
            <input
              type="range" min="0" max="1" step="0.05" value={volume}
              onChange={(e) => { const v = parseFloat(e.target.value); setVolume(v); if (audioRef.current) audioRef.current.volume = v; }}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: "#8b5cf6", background: `linear-gradient(to right, #8b5cf6 ${volume * 100}%, var(--border) ${volume * 100}%)` }}
            />
          </div>
        </div>

        {/* Row 2: download + quality badge */}
        <div className="flex items-center gap-2">
          {audioUrl && (
            <a href={audioUrl}
              download={`${(title || "podcast").slice(0, 40).replace(/[^a-z0-9]/gi, "_")}.mp3`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 hover:opacity-90"
              style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              MP3
            </a>
          )}
          {isPro ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)" }}>Neural2</span>
          ) : (
            <button onClick={onProWall} className="px-2 py-0.5 rounded-full text-[10px] font-medium hover:opacity-90 transition-opacity"
              style={{ background: "var(--bg3)", color: "var(--text3)", border: "1px solid var(--border)" }}>
              Upgrade for Neural2
            </button>
          )}
        </div>
      </div>

      {isTruncated && (
        <p className="mt-3 text-[10px] leading-relaxed" style={{ color: "var(--text3)" }}>
          Audio limited to first ~8,000 chars on Free plan.{" "}
          <a href={POLAR_BUY_URL} className="underline" style={{ color: "#8b5cf6" }}>Upgrade for full audio</a>
        </p>
      )}
    </div>
  );
}

// ─── Transcript Segment Row ───────────────────────────────────────────────────
function TranscriptSegmentRow({
  seg, idx, isActive, activeRef, onSeek,
}: {
  seg: TranscriptSegment;
  idx: number;
  isActive: boolean;
  activeRef?: React.RefObject<HTMLDivElement | null>;
  onSeek: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [segCopied, setSegCopied] = useState(false);
  const PREVIEW_LEN = 200;
  const isTruncated = seg.text.length > PREVIEW_LEN;
  const displayText = isTruncated && !expanded ? seg.text.slice(0, PREVIEW_LEN) + "…" : seg.text;

  const handleCopySegment = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(seg.text).then(() => {
      setSegCopied(true);
      setTimeout(() => setSegCopied(false), 1500);
    });
  };

  return (
    <div
      ref={isActive ? (activeRef as React.RefObject<HTMLDivElement>) : undefined}
      className="group px-2.5 py-2 rounded-lg transition-all duration-150"
      style={isActive
        ? { background: "rgba(139,92,246,0.18)", borderLeft: "2px solid #8b5cf6", marginLeft: 0 }
        : { borderLeft: "2px solid transparent" }}
    >
      <div className="flex gap-2.5 items-start">
        {/* Timestamp badge — click to seek */}
        <button
          onClick={onSeek}
          title="Jump to this position"
          className="flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold transition-all duration-150 hover:opacity-90"
          style={isActive
            ? { background: "rgba(139,92,246,0.25)", color: "var(--accent)" }
            : { background: "var(--bg3)", color: "var(--text3)" }}
        >
          {fmtTime(seg.t)}
        </button>

        {/* Text with speaker highlighting */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm leading-relaxed"
            style={{ color: isActive ? "var(--text)" : "var(--text2)" }}
          >
            {renderWithSpeakers(displayText)}
          </p>
          {isTruncated && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              className="mt-1 text-[11px] font-medium transition-colors hover:opacity-90"
              style={{ color: "#8b5cf6" }}
            >
              {expanded ? "Show less ▴" : "Read more ▾"}
            </button>
          )}
        </div>

        {/* Copy segment button */}
        <button
          onClick={handleCopySegment}
          title="Copy segment"
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-all duration-150 hover:bg-white/10"
          style={{ color: segCopied ? "#22c55e" : "var(--text3)" }}
        >
          {segCopied ? (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ConverterPage() {
  const { user, profile, isPro } = useUser();

  // Input state
  const [url, setUrl] = useState(() => {
    // Pre-fill from ?v=videoId (opened from history)
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("v");
      if (p) return `https://www.youtube.com/watch?v=${p}`;
    }
    return "";
  });
  const [mode, setMode] = useState<Mode>("full");
  const [language, setLanguage] = useState("original");

  // Sync default language from user settings
  useEffect(() => {
    if (profile?.settings?.defaultLanguage && profile.settings.defaultLanguage !== "original") {
      setLanguage(profile.settings.defaultLanguage);
    }
  }, [profile?.id]);

  // Queue / playlist
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [queueRunning, setQueueRunning] = useState(false);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistVideos, setPlaylistVideos] = useState<PlaylistVideo[]>([]);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  // Loading / result
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Fetching transcript...");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ConversionResult | null>(null);

  // Tabs
  const [tab, setTab] = useState<Tab>("transcript");

  // Summary
  const [summaryType, setSummaryType] = useState<SummaryType>("descriptive");
  const [aiSummary, setAiSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Pro wall
  const [showProWall, setShowProWall] = useState(false);
  const [proWallReason, setProWallReason] = useState<"limit" | "feature">("feature");
  const openProWall = (reason: "limit" | "feature" = "feature") => { setProWallReason(reason); setShowProWall(true); };

  // Transcript sync
  const [activeSegIdx, setActiveSegIdx] = useState(-1);
  const seekToSegmentRef = useRef<((segIdx: number) => void) | null>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Misc
  const [copied, setCopied] = useState(false);
  const [audioGenTrigger, setAudioGenTrigger] = useState(0);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Open from history: load transcript from Supabase (skip re-fetching from YouTube)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = new URLSearchParams(window.location.search).get("v");
    if (!v || !user) return;
    window.history.replaceState({}, "", "/app");
    const load = async () => {
      setLoading(true);
      setLoadingMsg("Loading from history…");
      setError("");
      setResult(null);
      setChatMessages([]);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("conversions")
          .select("video_id, video_title, transcript_text, language")
          .eq("user_id", user.id)
          .eq("video_id", v)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (data?.transcript_text) {
          const lang = data.language ?? "original";
          setLanguage(lang);
          const convResult: ConversionResult = {
            videoId: data.video_id,
            title: data.video_title ?? "YouTube Video",
            author: "",
            transcript: data.transcript_text,
            segments: [],
          };
          setResult(convResult);
          setTab("transcript");
          // Trigger audio — IDB cache checked first inside AudioPlayer
          setAudioGenTrigger((t) => t + 1);
        } else {
          // Fallback: re-convert from YouTube
          setUrl(`https://www.youtube.com/watch?v=${v}`);
          setTimeout(async () => {
            await handleConvert();
            setAudioGenTrigger((t) => t + 1);
          }, 100);
        }
      } catch {
        // Fallback: re-convert from YouTube
        setUrl(`https://www.youtube.com/watch?v=${v}`);
        setTimeout(async () => {
          await handleConvert();
          setAudioGenTrigger((t) => t + 1);
        }, 100);
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // AI summary via Groq (free, full transcript)
  useEffect(() => {
    if (!result) { setAiSummary(""); return; }
    setSummaryLoading(true);
    fetch(`${BACKEND_URL}/api/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-v2p-token": WEB_TTS_TOKEN },
      body: JSON.stringify({ type: "summary", transcript: result.transcript, wordCount: 300 }),
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setAiSummary(d.result ?? ""))
      .catch(() => setAiSummary(summarize(result.transcript, { type: "descriptive", wordCount: FREE_SUMMARY_WORDS })))
      .finally(() => setSummaryLoading(false));
  }, [result?.videoId]);

  const getToken = async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };

  // ── Fetch single video transcript (reusable) ──────────────────────────────
  const fetchVideoTranscript = async (videoId: string, token: string | null): Promise<ConversionResult> => {
    const res = await fetch(`${BACKEND_URL}/api/transcript`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ videoId, isPro }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error((d as { error?: string }).error ?? `Server error ${res.status}`);
    }
    const data = await res.json() as { title?: string; author?: string; transcript?: string; segments?: { t: number; text: string }[]; error?: string; limitReached?: boolean };
    if (data.limitReached) { openProWall("limit"); throw new Error("limit"); }
    if (data.error) throw new Error(data.error);
    let transcript = data.transcript ?? "";
    let segments = data.segments ?? [];
    if (language !== "original" && transcript) {
      const tRes = await fetch(`${BACKEND_URL}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ text: transcript, target: language }),
      });
      if (tRes.ok) {
        const td = await tRes.json() as { translated?: string };
        transcript = td.translated || transcript;
        segments = []; // translated text has no timestamp alignment
      }
    }
    return { videoId, title: data.title ?? "YouTube Video", author: data.author ?? "", transcript, segments };
  };

  // ── Playlist fetch ────────────────────────────────────────────────────────
  const handleLoadPlaylist = async (playlistId: string) => {
    setPlaylistLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/playlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ playlistId }),
      });
      if (!res.ok) throw new Error("Could not load playlist");
      const data = await res.json() as { videos: { id: string; title: string; thumbnail: string; duration?: string }[] };
      setPlaylistVideos(data.videos.map((v) => ({ ...v, selected: true })));
      setShowPlaylistModal(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load playlist");
    } finally {
      setPlaylistLoading(false);
    }
  };

  // ── Queue processing ──────────────────────────────────────────────────────
  const runQueue = async (items: QueueItem[]) => {
    setQueue(items);
    setQueueRunning(true);
    const token = await getToken();
    for (let i = 0; i < items.length; i++) {
      setQueue((q) => q.map((item, idx) => idx === i ? { ...item, status: "fetching" } : item));
      try {
        const convResult = await fetchVideoTranscript(items[i].videoId, token);
        setQueue((q) => q.map((item, idx) => idx === i ? { ...item, status: "done", result: convResult } : item));
        // Set first done as the displayed result
        if (i === 0) { setResult(convResult); setTab("transcript"); }
        // Save conversion
        if (user) {
          const supabase = createClient();
          await supabase.from("conversions").insert({
            user_id: user.id,
            video_id: convResult.videoId,
            video_url: `https://www.youtube.com/watch?v=${convResult.videoId}`,
            video_title: convResult.title,
            language: language === "original" ? "original" : language,
            transcript_text: convResult.transcript,
          });
        }
      } catch (e) {
        setQueue((q) => q.map((item, idx) => idx === i
          ? { ...item, status: "error", error: e instanceof Error ? e.message : "Failed" }
          : item));
      }
    }
    setQueueRunning(false);
  };

  const startFromPlaylist = () => {
    const selected = playlistVideos.filter((v) => v.selected);
    if (!selected.length) return;
    setShowPlaylistModal(false);
    setPlaylistVideos([]);
    const items: QueueItem[] = selected.map((v) => ({
      videoId: v.id,
      title: v.title,
      thumbnail: v.thumbnail,
      status: "pending",
    }));
    void runQueue(items);
  };

  const handleConvert = async () => {
    const trimmed = url.trim();
    const { videoIds, playlistId } = parseInputUrls(trimmed);

    // Playlist URL detected
    if (playlistId) {
      setError("");
      void handleLoadPlaylist(playlistId);
      return;
    }

    // Multiple video IDs
    if (videoIds.length > 1) {
      setError("");
      setResult(null);
      setChatMessages([]);
      const items: QueueItem[] = videoIds.map((id) => ({
        videoId: id,
        title: `Video ${id}`,
        thumbnail: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
        status: "pending",
      }));
      void runQueue(items);
      return;
    }

    // Single video (original behavior below)
    const videoId = extractVideoId(trimmed);
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
        openProWall("limit");
        return;
      }
    }

    setLoading(true);
    setLoadingMsg("Fetching transcript...");
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
        body: JSON.stringify({ videoId, isPro }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? `Server error: ${res.status}`);
      }

      const data = await res.json();
      if (data.limitReached) { openProWall("limit"); return; }
      if (data.error) throw new Error(data.error);
      let transcript = data.transcript ?? "";
      let segments: { t: number; text: string }[] = data.segments ?? [];

      // Translate if a non-original language is selected
      if (language !== "original" && transcript) {
        setLoadingMsg("Translating...");
        try {
          const tRes = await fetch(`${BACKEND_URL}/api/translate`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ text: transcript, target: language }),
          });
          if (tRes.ok) {
            const tData = await tRes.json();
            transcript = tData.translated || transcript;
            segments = []; // translated text loses timestamp alignment
          }
        } catch (_) { /* keep original on translate error */ }
      }

      const convResult: ConversionResult = {
        videoId,
        title: data.title ?? "YouTube Video",
        author: data.author ?? "Unknown",
        transcript,
        segments,
      };
      setResult(convResult);
      setTab("transcript");
      setAudioGenTrigger((t) => t + 1);

      // Save conversion
      if (user) {
        const supabase = createClient();
        await supabase.from("conversions").insert({
          user_id: user.id,
          video_id: videoId,
          video_url: `https://www.youtube.com/watch?v=${videoId}`,
          video_title: convResult.title,
          language: language === "original" ? "original" : language,
          transcript_text: convResult.transcript,
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

    const question = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: question }]);
    setChatLoading(true);

    try {
      // Groq — free for everyone, full transcript, no limit enforced
      const res = await fetch(`${BACKEND_URL}/api/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-v2p-token": WEB_TTS_TOKEN },
        body: JSON.stringify({ type: "chat", transcript: result.transcript, question }),
      });
      if (!res.ok) throw new Error("AI request failed");
      const data = await res.json();
      setChatMessages((prev) => [...prev, { role: "assistant", text: data.result ?? "I could not find an answer." }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Sorry, I encountered an error. Please try again.";
      setChatMessages((prev) => [...prev, { role: "assistant", text: msg }]);
    } finally {
      setChatLoading(false);
    }
  };

  const selectedLang = LANGUAGES.find((l) => l.code === language);

  // Real YouTube timestamps when available; smart-split fallback otherwise (exactly like extension)
  const realTimestamps = (result?.segments.length ?? 0) > 0;
  const effectiveSegments = realTimestamps
    ? (result?.segments ?? [])
    : result?.transcript ? smartSplitText(result.transcript) : [];

  // Summary: AI (Groq) for descriptive, extractive for others
  // When summaryType changes to a non-descriptive type, fetch from Groq too
  const groqTypeMap: Record<string, string> = { keypoints: "keypoints", tldr: "tldr" };
  const summaryText = result
    ? summaryType === "descriptive" && aiSummary
      ? aiSummary
      : summarize(result.transcript, { type: summaryType, wordCount: 500 })
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
    <div className="max-w-4xl mx-auto px-4 py-5 md:py-8">
      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 2px; }
      `}</style>

      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text)] mb-1">Convert YouTube Video</h1>
        <p className="text-sm text-[var(--text3)]">Paste a YouTube URL to get transcript, summary, and audio</p>
      </div>

      {/* ── Input Card ── */}
      <div className="rounded-2xl border p-4 md:p-6 mb-6" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
        {/* URL Input */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-[var(--text3)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
            </svg>
            <label className="text-xs font-medium text-[var(--text2)] uppercase tracking-wider">YouTube URL</label>
            <span className="text-[10px] text-[var(--text3)] ml-auto">Paste multiple URLs or a playlist link</span>
          </div>
          <textarea
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && !loading && handleConvert()}
            placeholder={"https://youtube.com/watch?v=...\nhttps://youtube.com/watch?v=... (one per line)\nhttps://youtube.com/playlist?list=..."}
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm text-[var(--text)] placeholder-[var(--text3)] border outline-none focus:border-[#8b5cf6] transition-colors resize-none"
            style={{ background: "var(--bg)", borderColor: "var(--border)" }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {/* Mode selector */}
          <div>
            <label className="block text-xs font-medium text-[var(--text2)] mb-2 uppercase tracking-wider">Mode</label>
            <div className="flex gap-1.5">
              {modes.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  title={m.desc}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${mode === m.value ? "text-white" : "text-[var(--text3)] hover:text-[var(--text2)]"}`}
                  style={mode === m.value ? { background: "#8b5cf6" } : { background: "var(--bg3)", border: "1px solid var(--border)" }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language selector */}
          <div>
            <label className="block text-xs font-medium text-[var(--text2)] mb-2 uppercase tracking-wider">Language</label>
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full py-2.5 pl-3 pr-8 rounded-xl text-sm text-[var(--text)] border outline-none focus:border-[#8b5cf6] transition-colors appearance-none"
                style={{ background: "var(--bg)", borderColor: "var(--border)" }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-[var(--text3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          disabled={loading || playlistLoading || queueRunning || !url.trim()}
          className="w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" }}
        >
          {(loading || playlistLoading || queueRunning) ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {playlistLoading ? "Loading Playlist..." : queueRunning ? "Processing Queue..." : "Processing..."}
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

      {/* ── Playlist Loading ── */}
      {playlistLoading && <LoadingOrb msg="Loading playlist..." />}

      {/* ── Queue Display ── */}
      {queue.length > 0 && (
        <div className="rounded-2xl border mb-6 overflow-hidden" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--text)]">Batch Queue</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}>
                {queue.filter((q) => q.status === "done").length}/{queue.length}
              </span>
            </div>
            {!queueRunning && (
              <button onClick={() => setQueue([])} className="text-xs text-[var(--text3)] hover:text-[var(--text2)] transition-colors">
                Clear
              </button>
            )}
          </div>
          <div className="divide-y divide-white/5">
            {queue.map((item, idx) => (
              <button
                key={item.videoId + idx}
                onClick={() => item.result && setResult(item.result)}
                disabled={item.status !== "done"}
                className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${item.result && result?.videoId === item.videoId ? "bg-white/5" : "hover:bg-white/[0.02]"} disabled:cursor-default`}
              >
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-14 h-9 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--text)] truncate">{item.title}</p>
                  <p className="text-[10px] text-[var(--text3)] mt-0.5 truncate">{item.videoId}</p>
                </div>
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                  {item.status === "pending" && <div className="w-2 h-2 rounded-full bg-[var(--text3)]" />}
                  {(item.status === "fetching" || item.status === "translating") && (
                    <div className="w-4 h-4 rounded-full border-2 border-[#8b5cf6] border-t-transparent animate-spin" />
                  )}
                  {item.status === "done" && (
                    <svg className="w-4 h-4 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {item.status === "error" && (
                    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Loading State ── */}
      {loading && <LoadingOrb msg={loadingMsg} />}

      {/* ── Result ── */}
      {result && !loading && (
        <div className="space-y-5">
          {/* Video info */}
          <div className="flex items-start gap-4 rounded-2xl border p-4" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
            <a href={`https://www.youtube.com/watch?v=${result.videoId}`} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
              <img
                src={`https://img.youtube.com/vi/${result.videoId}/mqdefault.jpg`}
                alt={result.title}
                className="w-24 h-16 object-cover rounded-lg hover:opacity-80 transition-opacity"
              />
            </a>
            <div className="flex-1 min-w-0">
              <a href={`https://www.youtube.com/watch?v=${result.videoId}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                <h2 className="font-semibold text-[var(--text)] text-sm leading-snug mb-1 line-clamp-2">{result.title}</h2>
              </a>
              <p className="text-xs text-[var(--text3)]">{result.author}</p>
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
            segments={effectiveSegments}
            realTimestamps={realTimestamps}
            isPro={isPro}
            langBcp47={selectedLang?.bcp47 ?? "en-US"}
            title={result.title}
            gender={profile?.settings?.voiceGender ?? "female"}
            onProWall={() => openProWall("feature")}
            onSegmentChange={(idx) => {
              setActiveSegIdx(idx);
              setTimeout(() => activeLineRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }), 50);
            }}
            seekToSegmentRef={seekToSegmentRef}
            generateTrigger={audioGenTrigger}
            cacheKey={result ? `audio_${result.videoId}_${language}` : undefined}
          />

          {/* Tabs */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
            {/* Tab bar */}
            <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
              {(["transcript", "summary", "chat"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-3 text-sm font-medium capitalize transition-all duration-150 ${tab === t ? "text-[#a78bfa] border-b-2" : "text-[var(--text3)] hover:text-[var(--text2)]"}`}
                  style={tab === t ? { borderBottomColor: "#8b5cf6" } : {}}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* ── Transcript Tab ── */}
            {tab === "transcript" && (
              <div className="p-3 md:p-5">
                {!realTimestamps && effectiveSegments.length > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg mb-3 text-[11px]" style={{ background: "var(--bg3)", color: "var(--text3)" }}>
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Timestamps are estimated — original video had no caption data
                  </div>
                )}
                <div
                  className="h-80 overflow-y-auto rounded-xl p-2 mb-4 scrollbar-thin"
                  style={{ background: "var(--bg)" }}
                >
                  {effectiveSegments.length > 0
                    ? effectiveSegments.map((seg, i) => (
                        <TranscriptSegmentRow
                          key={i}
                          seg={seg}
                          idx={i}
                          isActive={i === activeSegIdx}
                          activeRef={i === activeSegIdx ? activeLineRef : undefined}
                          onSeek={() => seekToSegmentRef.current?.(i)}
                        />
                      ))
                    : <p className="text-sm text-[var(--text3)] p-3">No transcript available.</p>
                  }
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text2)] border transition-all duration-150 hover:bg-white/5"
                    style={{ borderColor: "var(--border)" }}
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
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text2)] border transition-all duration-150 hover:bg-white/5"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    .TXT
                  </button>
                </div>
              </div>
            )}

            {/* ── Summary Tab ── */}
            {tab === "summary" && (
              <div className="p-3 md:p-5">
                {/* Summary type selector */}
                <div className="flex gap-1.5 mb-4 flex-wrap">
                  {summaryTypes.map((st) => (
                    <button
                      key={st.value}
                      onClick={() => setSummaryType(st.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${summaryType === st.value ? "text-white" : "text-[var(--text3)] hover:text-[var(--text2)]"}`}
                      style={summaryType === st.value ? { background: "#8b5cf6" } : { background: "var(--bg3)", border: "1px solid var(--border2)" }}
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
                  className="h-72 overflow-y-auto rounded-xl p-4 text-sm text-[var(--text2)] leading-relaxed whitespace-pre-wrap scrollbar-thin"
                  style={{ background: "var(--bg)" }}
                >
                  {summaryLoading && summaryType === "descriptive" ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                      <div className="w-6 h-6 rounded-full border-2 border-[#8b5cf6] border-t-transparent animate-spin" />
                      <span className="text-xs text-[var(--text3)]">Generating AI summary…</span>
                    </div>
                  ) : (
                    summaryText || "No content to summarize."
                  )}
                </div>
              </div>
            )}

            {/* ── Chat Tab ── */}
            {tab === "chat" && (
              <div className="p-3 md:p-5">
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
                      <p className="text-sm text-[var(--text3)]">Ask anything about this video</p>
                      <p className="text-xs text-[var(--text3)] mt-1 opacity-70">The AI uses the transcript to answer your questions</p>
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
                        className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "text-white rounded-tr-sm" : "text-[var(--text2)] rounded-tl-sm"}`}
                        style={msg.role === "user" ? { background: "#8b5cf6" } : { background: "var(--bg3)" }}
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
                      <div className="flex gap-1 px-3 py-2 rounded-2xl rounded-tl-sm" style={{ background: "var(--bg3)" }}>
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--text3)] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
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
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm text-[var(--text)] placeholder-[var(--text3)] border outline-none focus:border-[#8b5cf6] transition-colors"
                    style={{ background: "var(--bg)", borderColor: "var(--border)" }}
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

      {/* ── Playlist Selection Modal ── */}
      {showPlaylistModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPlaylistModal(false)} />
          <div
            className="relative w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl border shadow-2xl flex flex-col"
            style={{ background: "var(--bg2)", borderColor: "rgba(139,92,246,0.25)", maxHeight: "85vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
              <div>
                <h2 className="text-base font-bold text-[var(--text)]">Select Playlist Videos</h2>
                <p className="text-xs text-[var(--text3)] mt-0.5">{playlistVideos.length} videos found</p>
              </div>
              <button onClick={() => setShowPlaylistModal(false)} className="text-[var(--text3)] hover:text-[var(--text)] transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Select all / none */}
            <div className="flex items-center gap-3 px-5 py-2.5 border-b flex-shrink-0" style={{ borderColor: "var(--border2)" }}>
              <button
                onClick={() => setPlaylistVideos((vs) => vs.map((v) => ({ ...v, selected: true })))}
                className="text-xs font-medium text-[#a78bfa] hover:text-[#c084fc] transition-colors"
              >
                Select All
              </button>
              <span className="text-[var(--text3)] text-xs">·</span>
              <button
                onClick={() => setPlaylistVideos((vs) => vs.map((v) => ({ ...v, selected: false })))}
                className="text-xs font-medium text-[var(--text3)] hover:text-[var(--text2)] transition-colors"
              >
                Deselect All
              </button>
              <span className="ml-auto text-xs text-[var(--text3)]">
                {playlistVideos.filter((v) => v.selected).length} selected
              </span>
            </div>

            {/* Video list */}
            <div className="overflow-y-auto flex-1 divide-y divide-white/5">
              {playlistVideos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => setPlaylistVideos((vs) => vs.map((v) => v.id === video.id ? { ...v, selected: !v.selected } : v))}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/[0.03] transition-colors text-left"
                >
                  {/* Checkbox */}
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-all duration-150"
                    style={video.selected
                      ? { background: "#8b5cf6", borderColor: "#8b5cf6" }
                      : { background: "transparent", borderColor: "rgba(255,255,255,0.2)" }}
                  >
                    {video.selected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  {/* Thumbnail */}
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-20 h-12 object-cover rounded-lg flex-shrink-0"
                  />
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text)] line-clamp-2 leading-snug">{video.title}</p>
                    {video.duration && (
                      <p className="text-[10px] text-[var(--text3)] mt-1">{video.duration}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-5 py-4 border-t flex-shrink-0" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => setShowPlaylistModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text2)] border transition-all duration-150 hover:bg-white/5"
                style={{ borderColor: "var(--border)" }}
              >
                Cancel
              </button>
              <button
                onClick={startFromPlaylist}
                disabled={playlistVideos.filter((v) => v.selected).length === 0}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" }}
              >
                Convert Selected ({playlistVideos.filter((v) => v.selected).length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Pro Wall Modal ── */}
      {showProWall && <ProWallModal onClose={() => setShowProWall(false)} reason={proWallReason} />}
    </div>
  );
}
