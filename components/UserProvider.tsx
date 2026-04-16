"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  email: string;
  plan: "free" | "pro";
  isTrial?: boolean;
  trialEndsAt?: string | null;
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

      const { data, error } = await supabase.from("users").select("*").eq("id", u.id).single();
      if (error || !data) {
        await supabase.from("users").upsert({ id: u.id, email: email.toLowerCase(), plan: "free" });
        setProfile({ id: u.id, email, plan: "free", settings: { defaultLanguage: "original", voiceGender: "female", voiceName: null } });
      } else {
        setProfile(data);
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

  return (
    <Ctx.Provider value={{ user, profile, setProfile, loading, isPro, signIn, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useUser(): UserCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
