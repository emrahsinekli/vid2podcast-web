"use client";
import Link from "next/link";
import { useUser } from "@/components/UserProvider";
import { POLAR_BUY_URL } from "@/lib/constants";

export function SidebarPlanBadge() {
  const { profile, isPro } = useUser();
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: "var(--bg3)" }}>
      <span className="text-xs text-[var(--text3)] font-medium">Current Plan</span>
      {isPro ? (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>PRO</span>
      ) : (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa" }}>FREE</span>
      )}
    </div>
  );
}

export function SidebarUpgradeCTA() {
  const { isPro } = useUser();
  if (isPro) return null;
  return (
    <Link
      href="/app/upgrade"
      className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/30"
      style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" }}
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      Upgrade to Pro
    </Link>
  );
}

export function SidebarUserInfo() {
  const { profile } = useUser();
  const email = profile?.email ?? "";
  const avatarLetter = email.charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-2.5 px-3 py-2">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" }}
      >
        {avatarLetter}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--text)] truncate">{email}</p>
      </div>
    </div>
  );
}

export function MobileHeaderBadge() {
  const { isPro } = useUser();
  return isPro ? (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>PRO</span>
  ) : (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--border)", color: "var(--text2)" }}>FREE</span>
  );
}
