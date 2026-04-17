"use client";
// Free AI routing:
//   Desktop → Chrome Gemini Nano (built-in, no API cost)
//   Mobile  → Groq API (free tier, fast, works on all devices)
// Fallback → extractive algorithm (always works)

import { BACKEND_URL, WEB_TOKEN } from "@/lib/constants";

declare const LanguageModel: any;

const FREE_AI_DAILY_LIMIT = 2;

// ── Usage tracking ─────────────────────────────────────────────────────────────
function getAIUsage(): number {
  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem("v2p_ai_date") !== today) return 0;
  return Number(localStorage.getItem("v2p_ai_usage") || 0);
}

function incrementAIUsage(): void {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem("v2p_ai_usage", String(getAIUsage() + 1));
  localStorage.setItem("v2p_ai_date", today);
}

export function canUseAI(isPro: boolean): { ok: boolean; remaining: number } {
  if (isPro) return { ok: true, remaining: Infinity };
  const used = getAIUsage();
  if (used >= FREE_AI_DAILY_LIMIT) return { ok: false, remaining: 0 };
  return { ok: true, remaining: FREE_AI_DAILY_LIMIT - used };
}

export { FREE_AI_DAILY_LIMIT };

// ── Device detection ───────────────────────────────────────────────────────────
function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;
}

// ── Chrome Built-in AI (Gemini Nano) — Desktop only ───────────────────────────
let chromeAISession: any = null;

async function getChromeAI(): Promise<any> {
  if (isMobile()) return null; // Gemini Nano not available on mobile
  if (chromeAISession) return chromeAISession;
  try {
    if (typeof LanguageModel === "undefined") return null;
    const avail = await LanguageModel.availability();
    if (avail === "unavailable") return null;
    const attempts = [
      () => LanguageModel.create({ systemPrompt: "You are a helpful assistant.", temperature: 0.5, topK: 3 }),
      () => LanguageModel.create({ temperature: 0.5 }),
      () => LanguageModel.create({}),
    ];
    for (const attempt of attempts) {
      try { chromeAISession = await attempt(); break; } catch (_) {}
    }
    return chromeAISession ?? null;
  } catch (_) { return null; }
}

async function chromeAIPrompt(prompt: string): Promise<string | null> {
  const session = await getChromeAI();
  if (!session) return null;
  try { return await session.prompt(prompt); } catch (_) { return null; }
}

// ── Groq API (via backend) — Mobile only ──────────────────────────────────────
async function groqSummarize(text: string, wordCount: number): Promise<string | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-v2p-token": WEB_TOKEN },
      body: JSON.stringify({ type: "summary", transcript: text, wordCount }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result || null;
  } catch (_) { return null; }
}

async function groqAnswer(text: string, question: string): Promise<string | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-v2p-token": WEB_TOKEN },
      body: JSON.stringify({ type: "chat", transcript: text, question }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result || null;
  } catch (_) { return null; }
}

// ── Public API ─────────────────────────────────────────────────────────────────
export async function freeAISummarize(text: string, options: { wordCount?: number; isPro?: boolean } = {}): Promise<string> {
  const { wordCount = 150, isPro = false } = options;
  const gate = canUseAI(isPro);
  if (!gate.ok) throw new Error(`AI limit reached (${FREE_AI_DAILY_LIMIT}/day). Upgrade to Pro for unlimited.`);
  incrementAIUsage();

  if (isMobile()) {
    // Mobile → Groq API
    const groqResult = await groqSummarize(text, wordCount);
    if (groqResult) return groqResult;
  } else {
    // Desktop → Gemini Nano
    const chromeResult = await chromeAIPrompt(
      `Summarize this transcript in about ${wordCount} words. Clear paragraphs, capture main ideas:\n\n${text.slice(0, 8000)}`
    );
    if (chromeResult) return chromeResult;
  }

  // Fallback: extractive
  return extractiveFallback(text, wordCount);
}

export async function freeAIAnswer(text: string, question: string, isPro = false): Promise<string> {
  const gate = canUseAI(isPro);
  if (!gate.ok) throw new Error(`AI limit reached (${FREE_AI_DAILY_LIMIT}/day). Upgrade to Pro for unlimited.`);
  incrementAIUsage();

  if (isMobile()) {
    // Mobile → Groq API
    const groqResult = await groqAnswer(text, question);
    if (groqResult) return groqResult;
  } else {
    // Desktop → Gemini Nano
    const chromeResult = await chromeAIPrompt(
      `Based on this transcript, answer concisely.\n\nTranscript:\n${text.slice(0, 6000)}\n\nQuestion: ${question}\n\nAnswer:`
    );
    if (chromeResult) return chromeResult;
  }

  // Fallback: keyword search
  return keywordAnswer(text, question);
}

export async function checkFreeAI(): Promise<{ engine: string; name: string }> {
  if (isMobile()) return { engine: "groq", name: "Groq AI" };
  const chrome = await getChromeAI();
  if (chrome) return { engine: "chrome-ai", name: "Gemini Nano" };
  return { engine: "extractive", name: "Basic AI" };
}

// ── Fallbacks ──────────────────────────────────────────────────────────────────
function extractiveFallback(text: string, wordCount: number): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  if (sentences.length <= 3) return text;
  const freq: Record<string, number> = {};
  text.toLowerCase().split(/\s+/).forEach((w) => { if (w.length > 3) freq[w] = (freq[w] || 0) + 1; });
  const scored = sentences.map((s, i) => {
    const words = s.toLowerCase().split(/\s+/);
    const score = words.reduce((a, w) => a + (freq[w] || 0), 0) / (words.length || 1);
    const posBoost = i === 0 ? 2 : i === sentences.length - 1 ? 1.5 : 1;
    return { s: s.trim(), score: score * posBoost, idx: i };
  });
  const selected: typeof scored = [];
  let words = 0;
  for (const item of [...scored].sort((a, b) => b.score - a.score)) {
    if (words >= wordCount) break;
    selected.push(item);
    words += item.s.split(/\s+/).length;
  }
  return selected.sort((a, b) => a.idx - b.idx).map((x) => x.s).join(" ");
}

function keywordAnswer(text: string, question: string): string {
  const keywords = question.toLowerCase().split(/\s+/)
    .filter((w) => w.length > 3 && !["what", "when", "where", "which", "does", "how", "this", "that", "about", "from"].includes(w));
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const scored = sentences.map((s) => ({
    s: s.trim(),
    score: keywords.filter((k) => s.toLowerCase().includes(k)).length,
  }));
  const best = scored.sort((a, b) => b.score - a.score).slice(0, 3);
  if (best[0]?.score === 0) return "I couldn't find a specific answer in the transcript. Try rephrasing your question.";
  return best.map((x) => x.s).join(" ");
}
