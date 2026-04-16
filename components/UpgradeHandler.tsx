"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { BACKEND_URL, POLAR_BUY_URL } from "@/lib/constants";

export function UpgradeHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile, setProfile } = useUser();
  const [toast, setToast] = useState<"upgraded" | "trial" | null>(null);

  useEffect(() => {
    const upgraded = searchParams.get("upgraded");
    const checkoutId = searchParams.get("checkout_id");
    if (!upgraded) return;

    // Remove query params from URL immediately
    router.replace("/app");

    // Poll api/check until plan becomes pro (webhook may be a few seconds behind)
    const email = profile?.email;
    if (!email) return;

    let attempts = 0;
    const poll = async () => {
      attempts++;
      try {
        const r = await fetch(`${BACKEND_URL}/api/check?email=${encodeURIComponent(email)}`);
        if (r.ok) {
          const data = await r.json() as { plan: string; isTrial?: boolean; trialEndsAt?: string | null };
          if (data.plan === "pro") {
            setProfile((prev) => prev ? {
              ...prev,
              plan: "pro",
              isTrial: data.isTrial ?? false,
              trialEndsAt: data.trialEndsAt ?? null,
            } : prev);
            setToast(data.isTrial ? "trial" : "upgraded");
            setTimeout(() => setToast(null), 5000);
            return; // done
          }
        }
      } catch (_) {}
      // Retry up to 10 times (10 seconds total)
      if (attempts < 10) setTimeout(poll, 1000);
    };
    void poll();
  }, [searchParams]);

  if (!toast) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slideUp">
      <div
        className="flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border"
        style={{
          background: toast === "trial" ? "#0f1a0f" : "#0f0f1a",
          borderColor: toast === "trial" ? "rgba(34,197,94,0.4)" : "rgba(139,92,246,0.4)",
        }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: toast === "trial" ? "rgba(34,197,94,0.15)" : "rgba(139,92,246,0.15)" }}
        >
          {toast === "trial" ? (
            <svg className="w-5 h-5 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-[#a78bfa]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
            </svg>
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-[#f0f0f5]">
            {toast === "trial" ? "3-Day Free Trial Started!" : "Welcome to Pro!"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: toast === "trial" ? "#22c55e" : "#a78bfa" }}>
            {toast === "trial"
              ? "All Pro features unlocked for 3 days. Enjoy!"
              : "All features unlocked. Thank you for upgrading!"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Trial countdown banner (shown in sidebar for trial users) ────────────────
export function TrialBanner() {
  const { profile, isPro } = useUser();

  if (!isPro || !profile?.isTrial) return null;

  const daysLeft = profile.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(profile.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 3;

  return (
    <div
      className="rounded-xl px-3 py-2.5 text-xs"
      style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <svg className="w-3.5 h-3.5 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-semibold text-[#22c55e]">Free Trial Active</span>
      </div>
      <p className="text-[#a0a0b0] leading-snug">
        {daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining` : "Trial ends today"}
      </p>
      <a
        href={POLAR_BUY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block text-center py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
        style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" }}
      >
        Subscribe to Keep Pro
      </a>
    </div>
  );
}
