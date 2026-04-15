"use client";
// Free AI — Gemini Nano (Chrome built-in) → Transformers.js → extractive fallback
// No API key needed. Works in Chrome 127+ with built-in AI enabled.

declare const LanguageModel: any;

const FREE_AI_DAILY_LIMIT = 2;

// ── Usage tracking (localStorage instead of chrome.storage) ──

function getAIUsage(): number {
  const today = new Date().toISOString().slice(0, 10);
  const stored = localStorage.getItem("v2p_ai_date");
  if (stored !== today) return 0;
  return Number(localStorage.getItem("v2p_ai_usage") || 0);
}

function incrementAIUsage(): void {
  const today = new Date().toISOString().slice(0, 10);
  const current = getAIUsage();
  localStorage.setItem("v2p_ai_usage", String(current + 1));
  localStorage.setItem("v2p_ai_date", today);
}

export function canUseAI(isPro: boolean): { ok: boolean; remaining: number } {
  if (isPro) return { ok: true, remaining: Infinity };
  const used = getAIUsage();
  if (used >= FREE_AI_DAILY_LIMIT) return { ok: false, remaining: 0 };
  return { ok: true, remaining: FREE_AI_DAILY_LIMIT - used };
}

export { FREE_AI_DAILY_LIMIT };

// ── Chrome Built-in AI (Gemini Nano) ──

let chromeAISession: any = null;

async function getChromeAI(): Promise<any> {
  if (chromeAISession) return chromeAISession;
  try {
    if (typeof LanguageModel === "undefined") return null;
    const avail = await LanguageModel.availability();
    if (avail === "unavailable") return null;

    // Try different API shapes (Chrome keeps changing this)
    const attempts = [
      () => LanguageModel.create({ systemPrompt: "You are a helpful assistant.", temperature: 0.5, topK: 3 }),
      () => LanguageModel.create({ temperature: 0.5 }),
      () => LanguageModel.create({}),
    ];
    for (const attempt of attempts) {
      try { chromeAISession = await attempt(); break; } catch (_) {}
    }
    return chromeAISession ?? null;
  } catch (_) {
    return null;
  }
}

async function chromeAIPrompt(prompt: string): Promise<string | null> {
  const session = await getChromeAI();
  if (!session) return null;
  try {
    return await session.prompt(prompt);
  } catch (_) {
    return null;
  }
}

// ── Transformers.js Fallback (t5-small, runs in browser) ──

let transformersPipeline: any = null;

function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

async function getTransformersSummarizer(): Promise<any> {
  // Skip on mobile — model download is too heavy (60MB+), causes hang
  if (isMobile()) return null;
  if (transformersPipeline) return transformersPipeline;
  try {
    const mod = await withTimeout(
      import(
        // @ts-ignore
        "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2/dist/transformers.min.js"
      ),
      8000 // 8s timeout for the JS library itself
    );
    const { pipeline } = mod as any;
    transformersPipeline = await withTimeout(
      pipeline("summarization", "Xenova/t5-small"),
      30000 // 30s timeout for model download
    );
    return transformersPipeline;
  } catch (_) {
    return null;
  }
}

// ── Public API ──

export async function freeAISummarize(text: string, options: { wordCount?: number; isPro?: boolean } = {}): Promise<string> {
  const { wordCount = 150, isPro = false } = options;

  const gate = canUseAI(isPro);
  if (!gate.ok) throw new Error(`AI limit reached (${FREE_AI_DAILY_LIMIT}/day). Upgrade to Pro for unlimited.`);
  incrementAIUsage();

  // 1. Chrome Gemini Nano
  const chromeResult = await chromeAIPrompt(
    `Summarize this transcript in about ${wordCount} words. Clear paragraphs, capture main ideas:\n\n${text.slice(0, 8000)}`
  );
  if (chromeResult) return chromeResult;

  // 2. Transformers.js (t5-small)
  try {
    const summarizer = await getTransformersSummarizer();
    if (summarizer) {
      const result = await summarizer(text.slice(0, 3000), {
        max_length: Math.min(wordCount, 150),
        min_length: 30,
      });
      if (result?.[0]?.summary_text) return result[0].summary_text;
    }
  } catch (_) {}

  // 3. Extractive fallback
  return extractiveFallback(text, wordCount);
}

export async function freeAIAnswer(text: string, question: string, isPro = false): Promise<string> {
  const gate = canUseAI(isPro);
  if (!gate.ok) throw new Error(`AI limit reached (${FREE_AI_DAILY_LIMIT}/day). Upgrade to Pro for unlimited.`);
  incrementAIUsage();

  // 1. Chrome Gemini Nano
  const chromeResult = await chromeAIPrompt(
    `Based on this transcript, answer the question concisely.\n\nTranscript:\n${text.slice(0, 6000)}\n\nQuestion: ${question}\n\nAnswer:`
  );
  if (chromeResult) return chromeResult;

  // 2. Keyword-based fallback
  return keywordAnswer(text, question);
}

export async function checkFreeAI(): Promise<{ engine: string; name: string }> {
  const chrome = await getChromeAI();
  if (chrome) return { engine: "chrome-ai", name: "Gemini Nano" };
  return { engine: "extractive", name: "Basic AI" };
}

// ── Fallbacks ──

function extractiveFallback(text: string, wordCount: number): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  if (sentences.length <= 3) return text;

  const freq: Record<string, number> = {};
  text.toLowerCase().split(/\s+/).forEach((w) => {
    if (w.length > 3) freq[w] = (freq[w] || 0) + 1;
  });

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
