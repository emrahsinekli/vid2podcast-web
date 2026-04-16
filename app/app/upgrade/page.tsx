"use client";

import Link from "next/link";
import { POLAR_MONTHLY_URL, POLAR_YEARLY_URL, POLAR_LIFETIME_URL } from "@/lib/constants";
import { useUser } from "@/hooks/useUser";

const plans = [
  {
    id: "monthly",
    name: "Monthly",
    price: "$9.99",
    period: "/month",
    desc: "Billed monthly, cancel anytime",
    url: POLAR_MONTHLY_URL,
    highlighted: false,
    badge: null,
  },
  {
    id: "yearly",
    name: "Yearly",
    price: "$79.99",
    period: "/year",
    desc: "Save 33% vs monthly — $6.67/mo",
    url: POLAR_YEARLY_URL,
    highlighted: true,
    badge: "Best Value",
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: "$149.99",
    period: " once",
    desc: "Pay once, use forever",
    url: POLAR_LIFETIME_URL,
    highlighted: false,
    badge: null,
  },
];

const features = [
  { label: "Daily conversions", free: "1/day", pro: "Unlimited" },
  { label: "AI chat messages", free: "2/day", pro: "Unlimited" },
  { label: "TTS voice quality", free: "Browser", pro: "Google Neural2" },
  { label: "Summary length", free: "80 words", pro: "Full text" },
  { label: "Audio download", free: "❌", pro: "MP3 / WAV / OGG" },
  { label: "Playlist batch convert", free: "❌", pro: "✅" },
  { label: "History retention", free: "7 days", pro: "1 year" },
];

export default function UpgradePage() {
  const { isPro, profile } = useUser();

  if (isPro) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(34,197,94,0.15)" }}>
          <svg className="w-8 h-8 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#f0f0f5] mb-2">You&apos;re already Pro!</h1>
        <p className="text-[#a0a0b0] mb-6">You have full access to all features.</p>
        <Link href="/app" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: "#8b5cf6" }}>
          Go to App
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-[#f0f0f5] mb-3">Upgrade to Pro</h1>
        <p className="text-[#a0a0b0] max-w-md mx-auto">Unlimited conversions, Google Neural2 voices, and full AI features. No limits.</p>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="relative rounded-2xl border p-6 flex flex-col"
            style={plan.highlighted
              ? { background: "rgba(139,92,246,0.08)", borderColor: "rgba(139,92,246,0.5)" }
              : { background: "#111118", borderColor: "rgba(255,255,255,0.08)" }}
          >
            {plan.badge && (
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white"
                style={{ background: "#8b5cf6" }}
              >
                {plan.badge}
              </div>
            )}
            <div className="mb-4">
              <p className="text-sm font-medium text-[#a0a0b0] mb-1">{plan.name}</p>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold text-[#f0f0f5]">{plan.price}</span>
                <span className="text-sm text-[#606070] mb-1">{plan.period}</span>
              </div>
              <p className="text-xs text-[#606070] mt-1">{plan.desc}</p>
            </div>
            <a
              href={plan.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto block w-full py-2.5 rounded-xl text-sm font-semibold text-center text-white transition-all hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/20"
              style={plan.highlighted
                ? { background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" }
                : { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              Get {plan.name}
            </a>
          </div>
        ))}
      </div>

      {/* Feature comparison */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: "#111118", borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="grid grid-cols-3 px-5 py-3 border-b text-xs font-semibold uppercase tracking-wider" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <span className="text-[#606070]">Feature</span>
          <span className="text-center text-[#606070]">Free</span>
          <span className="text-center text-[#a78bfa]">Pro</span>
        </div>
        {features.map((f, i) => (
          <div
            key={f.label}
            className="grid grid-cols-3 px-5 py-3 text-sm"
            style={i % 2 === 0 ? {} : { background: "rgba(255,255,255,0.02)" }}
          >
            <span className="text-[#a0a0b0]">{f.label}</span>
            <span className="text-center text-[#606070]">{f.free}</span>
            <span className="text-center font-medium text-[#22c55e]">{f.pro}</span>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-[#606070] mt-6">
        Questions? <a href="mailto:support@vid2podcast.com" className="text-[#a78bfa] hover:underline">support@vid2podcast.com</a>
      </p>
    </div>
  );
}
