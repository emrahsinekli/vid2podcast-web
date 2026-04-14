import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("plan").eq("id", user.id).single();
  const isPro = profile?.plan === "pro";

  // Free: last 7 days; Pro: last 365 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (isPro ? 365 : 7));

  const { searchParams } = new URL(request.url);
  const stats = searchParams.get("stats");

  if (stats) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("conversions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", today.toISOString());
    return NextResponse.json({ today: count ?? 0, limit: isPro ? null : 1, isPro });
  }

  const { data } = await supabase
    .from("conversions")
    .select("id, video_id, video_url, video_title, language, mode, created_at")
    .eq("user_id", user.id)
    .gte("created_at", cutoff.toISOString())
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ conversions: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { video_id, video_url, video_title, language, mode, transcript_text, summary_text, duration_secs } = body;

  const { data, error } = await supabase.from("conversions").insert({
    user_id: user.id,
    video_id,
    video_url,
    video_title,
    language: language || "original",
    mode: mode || "full",
    transcript_text,
    summary_text,
    duration_secs,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversion: data });
}
