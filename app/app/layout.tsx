import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/supabase/server";
import { UpgradeHandler, TrialBanner } from "@/components/UpgradeHandler";
import { ThemeToggle } from "@/components/ThemeProvider";
import MobileBottomNav from "@/components/MobileBottomNav";
import { SidebarPlanBadge, SidebarUpgradeCTA, SidebarUserInfo, MobileHeaderBadge } from "@/components/SidebarPlan";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
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
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text2)] hover:text-[var(--text)] hover:bg-white/5 transition-all duration-150 group"
    >
      <span className="text-[var(--text3)] group-hover:text-[#8b5cf6] transition-colors">{icon}</span>
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
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text3)] hover:text-[var(--text)] hover:bg-white/5 transition-all duration-150 group"
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


// ─── Layout ─────────────────────────────────────────────────────────────────────
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  if (!user) {
    redirect("/?signin=1");
  }

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
      href: "/app/history",
      label: "History",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* ── Desktop Sidebar ── */}
      <aside
        className="hidden md:flex flex-col w-60 flex-shrink-0 border-r h-full"
        style={{ background: "var(--bg2)", borderColor: "var(--border)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
          <Image src="/logo.png" alt="Vid2Podcast" width={28} height={28} className="rounded-lg" />
          <span className="font-bold text-sm" style={{ color: "var(--text)" }}>Vid2Podcast</span>
          <ThemeToggle className="ml-auto" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} />
            ))}
          </div>
          {/* Settings pinned to bottom of nav */}
          <div className="mt-auto pt-4">
            <NavItem
              href="/app/settings"
              label="Settings"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
          </div>
        </nav>

        {/* Bottom section */}
        <div className="px-3 py-4 border-t space-y-3" style={{ borderColor: "var(--border)" }}>
          {/* Upgrade CTA for free users */}
          {/* Trial countdown for trial users */}
          <Suspense>
            <TrialBanner />
          </Suspense>

          <SidebarUpgradeCTA />
          <SidebarPlanBadge />
          <SidebarUserInfo />

          <SignOutForm />
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div
          className="flex md:hidden items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ background: "var(--bg2)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Vid2Podcast" width={24} height={24} className="rounded" />
            <span className="font-bold text-[var(--text)] text-sm">Vid2Podcast</span>
          </div>
          <div className="flex items-center gap-2">
            <MobileHeaderBadge />
            <ThemeToggle />
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto pb-16 md:pb-0" style={{ color: "var(--text)" }}>
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <MobileBottomNav />

      {/* Upgrade success handler + toast */}
      <Suspense>
        <UpgradeHandler />
      </Suspense>
    </div>
  );
}
