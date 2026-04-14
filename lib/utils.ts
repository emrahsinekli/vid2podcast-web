export function extractVideoId(url: string): string | null {
  if (!url) return null;
  const pattern = /(?:v=|\/shorts\/|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{11})/;
  const m = url.match(pattern);
  if (m) return m[1];
  if (/^[A-Za-z0-9_-]{11}$/.test(url)) return url;
  return null;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n) + "…" : str;
}
