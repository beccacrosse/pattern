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

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      return authFailedRedirect(request.url, error);
    }
  } catch (error) {
    return authFailedRedirect(request.url, error);
  }

  return response;
}

function authFailedRedirect(requestUrl: string, error: unknown) {
  const errUrl = new URL("/login", requestUrl);
  errUrl.searchParams.set("error", "auth");
  errUrl.searchParams.set("reason", encodeURIComponent(describeAuthFailure(error).slice(0, 280)));
  return NextResponse.redirect(errUrl);
}

function describeAuthFailure(error: unknown): string {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: string }).message || "")
      : String(error ?? "");
  const cause =
    error && typeof error === "object" && "cause" in error
      ? (error as { cause?: { code?: string; hostname?: string } }).cause
      : undefined;

  if (cause?.code === "ENOTFOUND" || /ENOTFOUND|fetch failed/i.test(message)) {
    const host =
      cause?.hostname ||
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^https?:\/\//, "") ||
      "Supabase";
    return `Cannot reach ${host}. That project was not found (paused or deleted). Update NEXT_PUBLIC_SUPABASE_URL and the anon key in .env.local.`;
  }

  return message || "sign_in_failed";
}
