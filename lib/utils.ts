export function extractVideoId(url: string): string | null {
  if (!url) return null;
  const pattern = /(?:v=|\/shorts\/|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{11})/;
  const m = url.match(pattern);
  if (m) return m[1];
  if (/^[A-Za-z0-9_-]{11}$/.test(url)) return url;
  return null;
}

export function extractPlaylistId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/[?&]list=([A-Za-z0-9_-]{10,50})/);
  return m ? m[1] : null;
}

export function parseInputUrls(raw: string): { videoIds: string[]; playlistId: string | null } {
  const lines = raw.split(/[\n,]+/).map((l) => l.trim()).filter(Boolean);
  // Check if any line is a playlist URL
  for (const line of lines) {
    const pid = extractPlaylistId(line);
    if (pid) return { videoIds: [], playlistId: pid };
  }
  // Extract individual video IDs
  const videoIds = lines.map(extractVideoId).filter((id): id is string => id !== null);
  return { videoIds, playlistId: null };
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
