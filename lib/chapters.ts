// Ported from extension lib/chapters.js

export interface Chapter {
  time: number;
  title: string;
  text: string;
}

export function generateChapters(text: string, chunkMinutes = 3): Chapter[] {
  if (!text || text.length < 200) return [{ time: 0, title: "Full episode", text }];
  const words = text.split(/\s+/);
  const wordsPerMin = 150;
  const wordsPerChunk = wordsPerMin * chunkMinutes;
  const chapters: Chapter[] = [];
  let idx = 0;
  while (idx < words.length) {
    const end = Math.min(idx + wordsPerChunk, words.length);
    let breakAt = end;
    if (end < words.length) {
      for (let i = end; i > idx + wordsPerChunk * 0.7; i--) {
        if (words[i - 1].match(/[.!?]$/)) { breakAt = i; break; }
      }
    }
    const chunkWords = words.slice(idx, breakAt);
    const chunkText = chunkWords.join(" ");
    const timeSeconds = Math.round((idx / wordsPerMin) * 60);
    const firstSentence = chunkText.match(/^[^.!?]+[.!?]/);
    const title = firstSentence ? firstSentence[0].slice(0, 60) : chunkWords.slice(0, 8).join(" ") + "...";
    chapters.push({ time: timeSeconds, title: title.trim(), text: chunkText });
    idx = breakAt;
  }
  return chapters;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
