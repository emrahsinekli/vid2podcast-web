// Extractive summarizer — ported from extension lib/summary.js

const STOP_WORDS = new Set(
  "a,an,the,and,or,but,if,while,of,at,by,for,with,about,against,between,into,through,during,before,after,above,below,to,from,up,down,in,out,on,off,over,under,again,further,then,once,here,there,when,where,why,how,all,any,both,each,few,more,most,other,some,such,no,nor,not,only,own,same,so,than,too,very,s,t,can,will,just,don,should,now,is,am,are,was,were,be,been,being,have,has,had,having,do,does,did,doing,i,me,my,we,our,you,your,he,him,his,she,her,it,its,they,them,their,what,which,who,whom,this,that,these,those,as,like,yeah,okay,uh,um,gonna,wanna,kind,sort".split(",")
);

function splitSentences(text: string): string[] {
  const punct = text.match(/[^.!?]+[.!?]+/g);
  if (punct && punct.length >= 3) return punct.map((s) => s.trim());
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += 20) chunks.push(words.slice(i, i + 20).join(" "));
  return chunks;
}

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s']/g, " ").split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w) && w.length > 2);
}

function scoreSentences(sentences: string[]) {
  const freq: Record<string, number> = {};
  for (const s of sentences) for (const w of tokenize(s)) freq[w] = (freq[w] || 0) + 1;
  return sentences.map((s, idx) => {
    const tokens = tokenize(s);
    const score = tokens.reduce((a, w) => a + (freq[w] || 0), 0) / (tokens.length || 1);
    const posBoost = idx === 0 ? 1.5 : idx === sentences.length - 1 ? 1.2 : 1;
    return { s, idx, score: score * posBoost, wordCount: s.split(/\s+/).length };
  });
}

export type SummaryType = "descriptive" | "keypoints" | "tldr" | "notes" | "thread";

export function summarize(text: string, options: { type?: SummaryType; wordCount?: number } = {}): string {
  if (!text || text.length < 100) return text;
  const { type = "descriptive", wordCount = 300 } = options;
  const sentences = splitSentences(text);
  if (sentences.length <= 3) return text;
  const scored = scoreSentences(sentences);
  const ranked = [...scored].sort((a, b) => b.score - a.score);
  const selected: typeof ranked = [];
  let totalWords = 0;
  for (const item of ranked) {
    if (totalWords >= wordCount) break;
    selected.push(item);
    totalWords += item.wordCount;
  }
  selected.sort((a, b) => a.idx - b.idx);
  const selectedText = selected.map((x) => x.s.trim()).filter(Boolean);

  switch (type) {
    case "tldr":
      return ranked.slice(0, 3).sort((a, b) => a.idx - b.idx).map((x) => x.s.trim()).join(" ");
    case "keypoints":
      return selectedText.map((s) => `• ${s}`).join("\n");
    case "notes": {
      const sections: string[] = [];
      for (let i = 0; i < selectedText.length; i += 3) {
        const group = selectedText.slice(i, i + 3);
        const heading = group[0].split(/\s+/).slice(0, 5).join(" ") + "...";
        sections.push(`## ${heading}\n${group.join(" ")}`);
      }
      return sections.join("\n\n");
    }
    case "thread": {
      const tweets: string[] = [];
      let current = "";
      let num = 1;
      for (const s of selectedText) {
        if ((current + " " + s).length > 260) {
          if (current) tweets.push(`${num}/ ${current.trim()}`);
          current = s; num++;
        } else { current += " " + s; }
      }
      if (current) tweets.push(`${num}/ ${current.trim()}`);
      return tweets.join("\n\n");
    }
    default:
      return selectedText.join(" ");
  }
}
