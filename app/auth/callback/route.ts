import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Sync user to our users table
      const email = data.user.email!;
      const userId = data.user.id;

      // Check if user already exists
      const { data: existing } = await supabase
        .from("users")
        .select("id, plan")
        .eq("id", userId)
        .single();

      if (!existing) {
        // New user — check if they have a pro subscription in subscribers table
        const { data: subscriber } = await supabase
          .from("subscribers")
          .select("plan")
          .eq("email", email.toLowerCase())
          .single();

        await supabase.from("users").insert({
          id: userId,
          email: email.toLowerCase(),
          plan: subscriber?.plan === "pro" ? "pro" : "free",
        });
      }

      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/?error=auth", request.url));
}
