import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function getUserProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("users").select("plan, email").eq("id", userId).single();
  return data as { plan: "free" | "pro"; email: string } | null;
}

// ─── Sidebar Nav Item ───────────────────────────────────────────────────────────
function NavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#a0a0b0] hover:text-[#f0f0f5] hover:bg-white/5 transition-all duration-150 group"
    >
      <span className="text-[#606070] group-hover:text-[#8b5cf6] transition-colors">{icon}</span>
      {label}
    </Link>
  );
}

// ─── Sign Out Form ──────────────────────────────────────────────────────────────
function SignOutForm() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#606070] hover:text-[#f0f0f5] hover:bg-white/5 transition-all duration-150 group"
      >
        <svg
          className="w-4 h-4 group-hover:text-red-400 transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        Sign Out
      </button>
    </form>
  );
}

// ─── Mobile Bottom Nav ──────────────────────────────────────────────────────────
function MobileBottomNav() {
  const navItems = [
    {
      href: "/app",
      label: "Convert",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
    },
    {
      href: "/app/dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      href: "/app/settings",
      label: "Settings",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 md:hidden border-t"
      style={{ background: "rgba(17,17,24,0.95)", borderColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}
    >
      <div className="flex items-center justify-around px-4 py-2 safe-area-bottom">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 px-6 py-2 rounded-xl text-[#606070] hover:text-[#8b5cf6] transition-colors"
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

// ─── Layout ─────────────────────────────────────────────────────────────────────
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  if (!user) {
    redirect("/?signin=1");
  }

  const profile = await getUserProfile(user.id);
  const plan = profile?.plan ?? "free";
  const email = profile?.email ?? user.email ?? "";
  const avatarLetter = email.charAt(0).toUpperCase();
  const isPro = plan === "pro";

  const navItems = [
    {
      href: "/app",
      label: "Convert",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
    },
    {
      href: "/app/dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      href: "/app/settings",
      label: "Settings",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0a0a0f" }}>
      {/* ── Desktop Sidebar ── */}
      <aside
        className="hidden md:flex flex-col w-60 flex-shrink-0 border-r h-full"
        style={{ background: "#111118", borderColor: "rgba(255,255,255,0.08)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <Image src="/logo.png" alt="Vid2Podcast" width={28} height={28} className="rounded-lg" />
          <span className="font-bold text-[#f0f0f5] text-sm">Vid2Podcast</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-3 py-4 border-t space-y-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {/* Upgrade CTA for free users */}
          {!isPro && (
            <a
              href="https://buy.polar.sh/polar_cl_PbOP9j9S1vNFdBCbtbK4MlWvPKjqrw6kIr8E62Wy1vp"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/30"
              style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Upgrade to Pro
            </a>
          )}

          {/* Plan badge */}
          <div
            className="flex items-center justify-between px-3 py-2 rounded-xl"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <span className="text-xs text-[#606070] font-medium">Current Plan</span>
            {isPro ? (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}
              >
                PRO
              </span>
            ) : (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa" }}
              >
                FREE
              </span>
            )}
          </div>

          {/* User info */}
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" }}
            >
              {avatarLetter}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#f0f0f5] truncate">{email}</p>
            </div>
          </div>

          <SignOutForm />
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div
          className="flex md:hidden items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ background: "#111118", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Vid2Podcast" width={24} height={24} className="rounded" />
            <span className="font-bold text-[#f0f0f5] text-sm">Vid2Podcast</span>
          </div>
          <div className="flex items-center gap-2">
            {isPro ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
                PRO
              </span>
            ) : (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)", color: "#a0a0b0" }}>
                FREE
              </span>
            )}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" }}
            >
              {avatarLetter}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto pb-16 md:pb-0" style={{ color: "#f0f0f5" }}>
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <MobileBottomNav />
    </div>
  );
}
