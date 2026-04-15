import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    // Build the response first so we can set cookies on it
    const redirectResponse = NextResponse.redirect(new URL(next, request.url));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(toSet) {
            // Set cookies on BOTH the request (for subsequent server reads) and the redirect response
            toSet.forEach(({ name, value }) => request.cookies.set(name, value));
            toSet.forEach(({ name, value, options }) =>
              redirectResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const email = data.user.email!;
      const userId = data.user.id;

      // Use service-role or re-create with the exchanged session for DB writes
      const { data: existing } = await supabase
        .from("users")
        .select("id, plan")
        .eq("id", userId)
        .single();

      if (!existing) {
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

      return redirectResponse;
    }
  }

  return NextResponse.redirect(new URL("/?error=auth", request.url));
}
