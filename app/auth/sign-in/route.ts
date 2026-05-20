import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim();
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;

  if (!email) {
    return NextResponse.redirect(new URL("/login?error=auth", request.url));
  }

  let response = NextResponse.redirect(new URL("/login?check=email", request.url));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    const errUrl = new URL("/login", request.url);
    errUrl.searchParams.set("error", "auth");
    errUrl.searchParams.set("reason", encodeURIComponent((error.message || "sign_in_failed").slice(0, 280)));
    return NextResponse.redirect(errUrl);
  }

  return response;
}
