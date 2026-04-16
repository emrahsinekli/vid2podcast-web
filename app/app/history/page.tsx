"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/supabase/client";
import { useUser } from "@/hooks/useUser";
import { LANGUAGES, POLAR_BUY_URL } from "@/lib/constants";

interface Conversion {
  id: string;
  video_id: string;
  title: string | null;
  language: string | null;
  mode: string | null;
  created_at: string;
}

const FREE_HISTORY_DAYS = 7;
const PAGE_SIZE = 20;

function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function getLangLabel(code: string) {
  if (!code || code === "original") return null;
  const lang = LANGUAGES.find((l) => l.code === code);
  return lang ? `${lang.flag} ${lang.label}` : code;
}

export default function HistoryPage() {
  const { user, isPro } = useUser();
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [langFilter, setLangFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Load full history from Supabase
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      let query = supabase
        .from("conversions")
        .select("id, video_id, title, language, mode, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Free plan: only last 7 days
      if (!isPro) {
        const cutoff = new Date(Date.now() - FREE_HISTORY_DAYS * 86400000).toISOString();
        query = query.gte("created_at", cutoff);
      }

      const { data } = await query;
      setConversions(data ?? []);
      setLoading(false);
    };
    load();
  }, [user, isPro]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const supabase = createClient();
    await supabase.from("conversions").delete().eq("id", id);
    setConversions((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);
    setConfirmId(null);
    showToast("Removed from history");
  };

  const handleClearAll = async () => {
    if (!user) return;
    const supabase = createClient();
    await supabase.from("conversions").delete().eq("user_id", user.id);
    setConversions([]);
    setConfirmId(null);
    showToast("History cleared");
  };

  // Unique languages in history for filter dropdown
  const usedLangs = useMemo(() => {
    const langs = new Set(conversions.map((c) => c.language ?? "original"));
    return Array.from(langs).filter((l) => l !== "original");
  }, [conversions]);

  // Filter + search
  const filtered = useMemo(() => {
    return conversions.filter((c) => {
      const matchesSearch = !search || (c.title ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesLang = langFilter === "all" || (c.language ?? "original") === langFilter;
      return matchesSearch && matchesLang;
    });
  }, [conversions, search, langFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  // Stats
  const totalConversions = conversions.length;
  const langCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of conversions) { const l = c.language ?? "original"; map[l] = (map[l] ?? 0) + 1; }
    return map;
  }, [conversions]);
  const topLang = Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-6 h-6 rounded-full border-2 border-[#8b5cf6] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-sm font-medium text-white shadow-xl animate-in fade-in slide-in-from-top-2"
          style={{ background: "rgba(34,197,94,0.9)", backdropFilter: "blur(8px)" }}
        >
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f0f5] mb-1">History</h1>
          <p className="text-sm text-[#606070]">
            {isPro ? "Full history — all time" : `Last ${FREE_HISTORY_DAYS} days on Free plan`}
          </p>
        </div>
        {conversions.length > 0 && (
          <button
            onClick={() => setConfirmId("__all__")}
            className="text-xs text-[#606070] hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg border"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Free plan notice */}
      {!isPro && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6 text-sm"
          style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}
        >
          <svg className="w-4 h-4 text-[#8b5cf6] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[#a0a0b0]">
            Free plan shows last {FREE_HISTORY_DAYS} days only.{" "}
            <a href={POLAR_BUY_URL} target="_blank" rel="noopener noreferrer" className="font-semibold underline" style={{ color: "#8b5cf6" }}>
              Upgrade to Pro
            </a>{" "}
            for full history (365 days).
          </p>
        </div>
      )}

      {/* Stats row */}
      {!loading && totalConversions > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Conversions", value: totalConversions },
            { label: "Top Language", value: topLang ? (getLangLabel(topLang[0]) ?? "Original") : "—" },
            { label: "This Week", value: conversions.filter((c) => Date.now() - new Date(c.created_at).getTime() < 7 * 86400000).length },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border p-4 text-center" style={{ background: "#111118", borderColor: "rgba(255,255,255,0.08)" }}>
              <p className="text-xl font-bold text-[#f0f0f5]">{value}</p>
              <p className="text-xs text-[#606070] mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search + filter */}
      {!loading && totalConversions > 0 && (
        <div className="flex gap-3 mb-5">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606070] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by title…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-[#f0f0f5] placeholder-[#606070] border outline-none focus:border-[#8b5cf6] transition-colors"
              style={{ background: "#111118", borderColor: "rgba(255,255,255,0.1)" }}
            />
          </div>
          {usedLangs.length > 0 && (
            <select
              value={langFilter}
              onChange={(e) => { setLangFilter(e.target.value); setPage(1); }}
              className="px-3 py-2.5 rounded-xl text-sm text-[#f0f0f5] border outline-none focus:border-[#8b5cf6] transition-colors appearance-none"
              style={{ background: "#111118", borderColor: "rgba(255,255,255,0.1)" }}
            >
              <option value="all">All languages</option>
              {usedLangs.map((l) => (
                <option key={l} value={l}>{getLangLabel(l) ?? l}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-[#8b5cf6] border-t-transparent animate-spin" />
          <p className="text-sm text-[#606070]">Loading history…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border" style={{ background: "#111118", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(255,255,255,0.04)" }}>
            <svg className="w-7 h-7 text-[#606070]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          {search || langFilter !== "all" ? (
            <>
              <p className="text-sm text-[#606070] mb-1">No results for your filters</p>
              <button onClick={() => { setSearch(""); setLangFilter("all"); }} className="text-xs text-[#8b5cf6] hover:underline mt-2">Clear filters</button>
            </>
          ) : (
            <>
              <p className="text-sm text-[#606070] mb-1">No conversions yet</p>
              <p className="text-xs text-[#606070] opacity-60 mb-5">Convert a YouTube video to see it here</p>
              <Link href="/app" className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#8b5cf6" }}>
                Convert a Video
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-2xl border overflow-hidden" style={{ background: "#111118", borderColor: "rgba(255,255,255,0.08)" }}>
            {/* Header row */}
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider border-b" style={{ color: "#606070", borderColor: "rgba(255,255,255,0.06)" }}>
              <span>Video</span>
              <span>Language</span>
              <span>Date</span>
              <span></span>
            </div>
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              {paginated.map((conv) => (
                <div key={conv.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                  {/* Thumbnail */}
                  <img
                    src={`https://img.youtube.com/vi/${conv.video_id}/mqdefault.jpg`}
                    alt=""
                    className="w-16 h-11 object-cover rounded-lg flex-shrink-0"
                    loading="lazy"
                  />
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#f0f0f5] truncate leading-tight">
                      {conv.title || "Untitled Video"}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-[#606070]">{relativeDate(conv.created_at)}</span>
                      {conv.language && conv.language !== "original" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}>
                          {getLangLabel(conv.language)}
                        </span>
                      )}
                      {conv.mode && conv.mode !== "full" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(255,255,255,0.06)", color: "#606070" }}>
                          {conv.mode}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/app?v=${conv.video_id}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                      style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)" }}
                    >
                      Open
                    </Link>
                    <button
                      onClick={() => setConfirmId(conv.id)}
                      disabled={deletingId === conv.id}
                      title="Remove from history"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-[#606070] hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      {deletingId === conv.id ? (
                        <div className="w-3.5 h-3.5 rounded-full border border-current border-t-transparent animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center mt-5">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#a0a0b0] border transition-all hover:bg-white/5 hover:text-[#f0f0f5]"
                style={{ borderColor: "rgba(255,255,255,0.12)" }}
              >
                Load more ({filtered.length - paginated.length} remaining)
              </button>
            </div>
          )}

          <p className="text-center text-xs text-[#606070] mt-4">
            Showing {paginated.length} of {filtered.length} conversions
          </p>
        </>
      )}

      {/* Confirm delete modal */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmId(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border p-6 shadow-2xl" style={{ background: "#111118", borderColor: "rgba(239,68,68,0.3)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(239,68,68,0.1)" }}>
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#f0f0f5]">
                  {confirmId === "__all__" ? "Clear all history?" : "Remove from history?"}
                </p>
                <p className="text-xs text-[#606070] mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 py-2 rounded-xl text-sm font-medium text-[#a0a0b0] border transition-all hover:bg-white/5"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => confirmId === "__all__" ? handleClearAll() : handleDelete(confirmId)}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "#ef4444" }}
              >
                {confirmId === "__all__" ? "Clear All" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
