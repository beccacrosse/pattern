import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function loginErrorRedirect(requestUrl: URL, message: string) {
  const url = new URL("/login", requestUrl.origin);
  url.searchParams.set("error", "auth");
  if (message) {
    url.searchParams.set("reason", encodeURIComponent(message.slice(0, 280)));
  }
  return NextResponse.redirect(url);
}

function isEmailOtpType(t: string | null): t is "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email" {
  return (
    t === "signup" ||
    t === "invite" ||
    t === "magiclink" ||
    t === "recovery" ||
    t === "email_change" ||
    t === "email"
  );
}

/**
 * PKCE + cookies: the Supabase client must write auth cookies onto the same
 * `NextResponse` you return (especially on redirects). Using only `cookies()`
 * from `next/headers` often drops the session / code-verifier on redirect.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  let next = requestUrl.searchParams.get("next") ?? "/";
  if (!next.startsWith("/") || next.startsWith("//")) {
    next = "/";
  }
  const origin = requestUrl.origin;

  const oauthError = requestUrl.searchParams.get("error_description") ?? requestUrl.searchParams.get("error");
  if (oauthError && !code && !token_hash) {
    return loginErrorRedirect(requestUrl, oauthError);
  }

  const redirectTarget = new URL(next, origin);
  let response = NextResponse.redirect(redirectTarget);

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

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }

    const msg = error.message || "code_exchange_failed";
    if (msg.includes("PKCE") || msg.includes("code verifier")) {
      return loginErrorRedirect(
        requestUrl,
        "PKCE: open the magic link in the same browser where you clicked “Send magic link”, or try again."
      );
    }
    return loginErrorRedirect(requestUrl, msg);
  }

  if (token_hash) {
    const otpType = isEmailOtpType(type) ? type : "email";
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: otpType,
    });
    if (!error) {
      return response;
    }
    return loginErrorRedirect(requestUrl, error.message || "verify_otp_failed");
  }

  return loginErrorRedirect(requestUrl, "Missing auth parameters (no code or token_hash). Check Supabase redirect URLs.");
}
