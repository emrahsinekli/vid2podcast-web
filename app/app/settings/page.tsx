"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { LANGUAGES } from "@/lib/constants";
import { createClient } from "@/supabase/client";

export default function SettingsPage() {
  const { profile, loading } = useUser();
  const [defaultLanguage, setDefaultLanguage] = useState("original");
  const [voiceGender, setVoiceGender] = useState<"female" | "male">("female");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile?.settings) {
      setDefaultLanguage(profile.settings.defaultLanguage ?? "original");
      setVoiceGender(profile.settings.voiceGender ?? "female");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase.from("users").update({
        settings: { defaultLanguage, voiceGender, voiceName: profile.settings?.voiceName ?? null },
      }).eq("id", profile.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "var(--bg2)" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text)] mb-1">Settings</h1>
        <p className="text-sm text-[var(--text3)]">Customize your conversion preferences</p>
      </div>

      <div className="rounded-2xl border p-6 space-y-6" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>

        {/* Default Language */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text2)] mb-2 uppercase tracking-wider">
            Default Language
          </label>
          <p className="text-xs text-[var(--text3)] mb-3">Transcripts will be translated to this language by default.</p>
          <div className="relative">
            <select
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value)}
              className="w-full py-2.5 pl-3 pr-8 rounded-xl text-sm text-[var(--text)] border outline-none appearance-none transition-colors focus:border-[#8b5cf6]"
              style={{ background: "var(--bg)", borderColor: "var(--border)" }}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-[var(--text3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Voice Gender */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text2)] mb-2 uppercase tracking-wider">
            Voice Gender (TTS)
          </label>
          <p className="text-xs text-[var(--text3)] mb-3">Preferred voice for text-to-speech playback.</p>
          <div className="flex gap-2">
            {(["female", "male"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setVoiceGender(g)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all duration-150"
                style={voiceGender === g
                  ? { background: "#8b5cf6", color: "#fff" }
                  : { background: "var(--bg3)", color: "var(--text3)", border: "1px solid var(--border)" }}
              >
                {g === "female" ? "♀ Female" : "♂ Male"}
              </button>
            ))}
          </div>
        </div>

        {/* Account info */}
        <div className="pt-2 border-t" style={{ borderColor: "var(--border2)" }}>
          <p className="text-xs text-[var(--text3)] mb-1 font-semibold uppercase tracking-wider">Account</p>
          <p className="text-sm text-[var(--text2)]">{profile?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={profile?.plan === "pro"
                ? { background: "rgba(34,197,94,0.15)", color: "#22c55e" }
                : { background: "rgba(139,92,246,0.2)", color: "#a78bfa" }}
            >
              {profile?.plan?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/20 flex items-center justify-center gap-2"
          style={{ background: saved ? "rgba(34,197,94,0.8)" : "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" }}
        >
          {saving ? (
            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : saved ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Saved!
            </>
          ) : (
            "Save Settings"
          )}
        </button>

        {/* Sign Out — mobile only (desktop has it in sidebar) */}
        <form action="/auth/signout" method="post" className="md:hidden">
          <button
            type="submit"
            className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-150 hover:opacity-80"
            style={{ background: "var(--bg3)", color: "var(--text3)", border: "1px solid var(--border)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
