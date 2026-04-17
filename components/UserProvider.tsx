"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/supabase/client";
import type { User } from "@supabase/supabase-js";
import { MAX_FREE_CREDITS, SIGNUP_CREDITS } from "@/lib/constants";

export interface UserProfile {
  id: string;
  email: string;
  plan: "free" | "pro";
  isTrial?: boolean;
  trialEndsAt?: string | null;
  credits: number;
  creditsLastRefill: string;
  settings: {
    defaultLanguage: string;
    voiceGender: "female" | "male";
    voiceName: string | null;
  };
}

interface UserCtx {
  user: User | null;
  profile: UserProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  loading: boolean;
  isPro: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  spendCredit: () => Promise<void>;
}

const Ctx = createContext<UserCtx | null>(null);

// Module-level Supabase client — created once, never recreated
const supabase = createClient();

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false); // prevent concurrent fetches

  useEffect(() => {
    // Initial session
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (data.user) fetchProfile(data.user);
      else setLoading(false);
    });

    // Auth state changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // TOKEN_REFRESHED fires every ~60s — skip re-fetching profile for it
      if (event === "TOKEN_REFRESHED") return;
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []); // runs once

  async function fetchProfile(u: User) {
    if (fetchingRef.current) return; // already in flight
    fetchingRef.current = true;
    try {
      const email = u.email ?? "";
      const today = new Date().toISOString().slice(0, 10);

      const { data, error } = await supabase.from("users").select("*").eq("id", u.id).single();
      if (error || !data) {
        // New user — give SIGNUP_CREDITS
        await supabase.from("users").upsert({
          id: u.id,
          email: email.toLowerCase(),
          plan: "free",
          credits: SIGNUP_CREDITS,
          credits_last_refill: today,
        });
        setProfile({
          id: u.id, email, plan: "free",
          credits: SIGNUP_CREDITS, creditsLastRefill: today,
          settings: { defaultLanguage: "original", voiceGender: "female", voiceName: null },
        });
      } else {
        // Existing user — check daily refill
        let credits = data.credits ?? SIGNUP_CREDITS;
        let creditsLastRefill = data.credits_last_refill ?? today;

        if (creditsLastRefill < today && data.plan !== "pro") {
          credits = Math.min(credits + 1, MAX_FREE_CREDITS);
          creditsLastRefill = today;
          // best-effort update
          supabase.from("users").update({ credits, credits_last_refill: creditsLastRefill }).eq("id", u.id).then(() => {});
        }

        setProfile({ ...data, credits, creditsLastRefill });
      }

      // Sync plan from subscribers table (one-time, not polling)
      if (email) {
        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://vid2podcast-backend.vercel.app";
          const r = await fetch(`${backendUrl}/api/check?email=${encodeURIComponent(email.toLowerCase())}`);
          if (r.ok) {
            const resp = await r.json() as { plan: string; isTrial?: boolean; trialEndsAt?: string | null };
            if (resp.plan) {
              setProfile((prev) => prev ? {
                ...prev,
                plan: resp.plan as "free" | "pro",
                isTrial: resp.isTrial ?? false,
                trialEndsAt: resp.trialEndsAt ?? null,
              } : prev);
            }
          }
        } catch (_) { /* non-critical */ }
      }
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }

  const isPro = profile?.plan === "pro";

  async function signIn() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const spendCredit = useCallback(async () => {
    if (!user || !profile) return;
    const newCredits = Math.max(0, profile.credits - 1);
    setProfile((prev) => prev ? { ...prev, credits: newCredits } : prev);
    try {
      await supabase.from("users").update({ credits: newCredits }).eq("id", user.id);
    } catch (_) { /* best-effort */ }
  }, [user, profile]);

  return (
    <Ctx.Provider value={{ user, profile, setProfile, loading, isPro, signIn, signOut, spendCredit }}>
      {children}
    </Ctx.Provider>
  );
}

export function useUser(): UserCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
