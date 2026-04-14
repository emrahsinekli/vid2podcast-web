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
    const { data } = await supabase.from("users").select("*").eq("id", userId).single();
    setProfile(data);
    setLoading(false);
  }

  const isPro = profile?.plan === "pro";

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return { user, profile, loading, isPro, signIn, signOut };
}
