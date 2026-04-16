import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { LANGUAGES, POLAR_BUY_URL } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Conversion {
  id: string;
  video_id: string;
  title: string;
  language: string;
  created_at: string;
}

interface UserProfile {
  plan: "free" | "pro";
  settings: {
    defaultLanguage: string;
    voiceGender: "female" | "male";
  } | null;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl border p-5" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
      <p className="text-xs font-medium text-[var(--text3)] uppercase tracking-wider mb-2">{label}</p>
      <div className="text-2xl font-bold text-[var(--text)] mb-1">{value}</div>
      {sub && <p className="text-xs text-[var(--text3)]">{sub}</p>}
    </div>
  );
}


// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/?signin=1");

  // Fetch profile
  const { data: profileData } = await supabase
    .from("users")
    .select("plan, settings")
    .eq("id", user.id)
    .single();

  const profile: UserProfile = profileData ?? { plan: "free", settings: null };
  const isPro = profile.plan === "pro";

  // Fetch today's conversion count
  const today = new Date().toISOString().split("T")[0];
  const { count: todayCount } = await supabase
    .from("conversions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", today);

  // Fetch recent conversions
  const { data: conversions } = await supabase
    .from("conversions")
    .select("id, video_id, title, language, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const recentConversions: Conversion[] = conversions ?? [];
  const usedToday = todayCount ?? 0;

  const getLangLabel = (code: string) => {
    const lang = LANGUAGES.find((l) => l.code === code);
    return lang ? `${lang.flag} ${lang.label}` : code;
  };

  const proFeatures = [
    "Unlimited conversions",
    "Unlimited AI chat",
    "Google Neural2 voices",
    "All summary types",
    "Priority processing",
  ];

  const freeFeatures = [
    "1 conversion per day",
    "2 AI chat messages",
    "Browser TTS voices",
    "Basic summary",
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text)] mb-1">Dashboard</h1>
        <p className="text-sm text-[var(--text3)]">Manage your account, track usage, and view history</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Usage Card */}
          <div className="rounded-2xl border p-6" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
            <h2 className="font-semibold text-[var(--text)] mb-5 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#8b5cf6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Today&apos;s Usage
            </h2>

            {isPro ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <div className="h-full rounded-full" style={{ width: "100%", background: "linear-gradient(90deg, #22c55e, #16a34a)" }} />
                </div>
                <span className="text-sm font-semibold text-[#22c55e]">Unlimited</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--text2)]">Conversions today</span>
                  <span className="text-sm font-semibold text-[var(--text)]">{usedToday} / 1</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: "var(--border)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, usedToday * 100)}%`,
                      background: usedToday >= 1 ? "#ef4444" : "linear-gradient(90deg, #8b5cf6, #a78bfa)",
                    }}
                  />
                </div>
                {usedToday >= 1 && (
                  <div className="flex items-start gap-2 text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5" }}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Daily limit reached. Resets at midnight.{" "}
                    <a href={POLAR_BUY_URL} className="underline font-medium">Upgrade for unlimited</a>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Recent Conversions */}
          <div className="rounded-2xl border" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-semibold text-[var(--text)] flex items-center gap-2">
                <svg className="w-4 h-4 text-[#8b5cf6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent Conversions
              </h2>
              <div className="flex items-center gap-3">
                <Link href="/app/history" className="text-xs text-[var(--text3)] hover:text-[var(--text2)] transition-colors">
                  View all →
                </Link>
                <Link href="/app" className="text-xs text-[#8b5cf6] hover:text-[#a78bfa] transition-colors">
                  + New
                </Link>
              </div>
            </div>

            {recentConversions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--bg3)" }}>
                  <svg className="w-6 h-6 text-[var(--text3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <p className="text-sm text-[var(--text3)] mb-1">No conversions yet</p>
                <p className="text-xs text-[var(--text3)] opacity-60 mb-4">Convert your first YouTube video to get started</p>
                <Link
                  href="/app"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "#8b5cf6" }}
                >
                  Convert a Video
                </Link>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border2)" }}>
                {recentConversions.map((conv) => (
                  <div key={conv.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                    <img
                      src={`https://img.youtube.com/vi/${conv.video_id}/mqdefault.jpg`}
                      alt={conv.title}
                      className="w-16 h-11 object-cover rounded-lg flex-shrink-0"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text)] truncate mb-1">{conv.title || "Untitled Video"}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-[var(--text3)]">{formatDate(conv.created_at)}</span>
                        {conv.language && conv.language !== "original" && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}
                          >
                            {getLangLabel(conv.language)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/app?v=${conv.video_id}`}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text2)] border transition-all hover:bg-white/5 hover:text-[var(--text)]"
                      style={{ borderColor: "var(--border)" }}
                    >
                      Open
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="space-y-6">

          {/* Subscription Card */}
          <div className="rounded-2xl border p-6" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
            <h2 className="font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#8b5cf6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Subscription
            </h2>

            <div className="flex items-center justify-between mb-5">
              <span className="text-sm text-[var(--text2)]">Current Plan</span>
              {isPro ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
                  PRO
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: "var(--border)", color: "var(--text2)" }}>
                  FREE
                </span>
              )}
            </div>

            <div className="space-y-2 mb-5">
              {(isPro ? proFeatures : freeFeatures).map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-[var(--text2)]">
                  <svg className={`w-3.5 h-3.5 flex-shrink-0 ${isPro ? "text-[#22c55e]" : "text-[var(--text3)]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </div>
              ))}
            </div>

            {isPro ? (
              <a
                href="mailto:support@vid2podcast.com?subject=Billing"
                className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold border transition-all hover:bg-white/5 text-[var(--text2)]"
                style={{ borderColor: "var(--border)" }}
              >
                Manage Billing
              </a>
            ) : (
              <a
                href={POLAR_BUY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/20"
                style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" }}
              >
                Upgrade to Pro — $9.99
              </a>
            )}

            {!isPro && (
              <p className="text-center text-[10px] text-[var(--text3)] mt-3">One-time payment · No subscription · Forever access</p>
            )}
          </div>

          {/* Feature Comparison */}
          {!isPro && (
            <div className="rounded-2xl border p-5" style={{ background: "rgba(139,92,246,0.05)", borderColor: "rgba(139,92,246,0.2)" }}>
              <p className="text-xs font-semibold text-[#a78bfa] uppercase tracking-wider mb-3">Pro vs Free</p>
              <div className="space-y-2.5">
                {[
                  { feature: "Daily conversions", free: "1", pro: "Unlimited" },
                  { feature: "AI chat messages", free: "2", pro: "Unlimited" },
                  { feature: "TTS voices", free: "Browser", pro: "Neural2" },
                  { feature: "Summary word limit", free: "80 words", pro: "Full" },
                ].map((row) => (
                  <div key={row.feature} className="grid grid-cols-3 gap-2 text-xs">
                    <span className="text-[var(--text3)]">{row.feature}</span>
                    <span className="text-center text-[var(--text3)]">{row.free}</span>
                    <span className="text-center font-semibold text-[#22c55e]">{row.pro}</span>
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-2 text-[10px] text-[var(--text3)] pb-2 border-b mb-1 mt-1" style={{ borderColor: "var(--border2)" }}>
                  <span />
                  <span className="text-center">Free</span>
                  <span className="text-center text-[#a78bfa]">Pro</span>
                </div>
              </div>
            </div>
          )}

          {/* Settings link */}
          <Link
            href="/app/settings"
            className="flex items-center justify-between px-4 py-3 rounded-2xl border transition-all hover:bg-white/[0.03]"
            style={{ background: "var(--bg2)", borderColor: "var(--border)" }}
          >
            <span className="flex items-center gap-2 text-sm font-medium text-[var(--text2)]">
              <svg className="w-4 h-4 text-[#8b5cf6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Account Settings
            </span>
            <svg className="w-4 h-4 text-[var(--text3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
