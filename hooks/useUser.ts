"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  email: string;
  plan: "free" | "pro";
  settings: {
    defaultLanguage: string;
    voiceGender: "female" | "male";
    voiceName: string | null;
  };
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) fetchProfile(data.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data: session } = await supabase.auth.getUser();
    const email = session?.user?.email ?? "";

    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();
    if (error || !data) {
      // Row missing — upsert a default free profile
      await supabase.from("users").upsert({ id: userId, email: email.toLowerCase(), plan: "free" });
      setProfile({ id: userId, email, plan: "free", settings: { defaultLanguage: "original", voiceGender: "female", voiceName: null } });
    } else {
      setProfile(data);
    }

    // Sync plan from subscribers table — same source as the extension (api/check)
    // Ensures: Pro bought via extension → web app sees Pro, and vice versa
    if (email) {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://vid2podcast-backend.vercel.app";
        const r = await fetch(`${backendUrl}/api/check?email=${encodeURIComponent(email.toLowerCase())}`);
        if (r.ok) {
          const { plan: realPlan } = await r.json() as { plan: string };
          const currentPlan = data?.plan ?? "free";
          if (realPlan && realPlan !== currentPlan) {
            await supabase.from("users").update({ plan: realPlan }).eq("id", userId);
            setProfile((prev) => prev ? { ...prev, plan: realPlan as "free" | "pro" } : prev);
          }
        }
      } catch (_) { /* non-critical — fall back to stored plan */ }
    }

    setLoading(false);
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

  return { user, profile, loading, isPro, signIn, signOut };
}
