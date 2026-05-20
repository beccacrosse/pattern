import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { instagramGraphApiAdapter } from "@/lib/data-sources/instagramGraphApiAdapter";
import { runAdapterSync } from "@/lib/sync/runAdapterSync";

/**
 * Vercel Cron (or any scheduler) can GET this route with `Authorization: Bearer CRON_SECRET`.
 * Phase 2: resolve user from stored integration / Meta token instead of cookie session.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          /* cron has no session */
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "No Supabase session in cron context. Phase 2: use service role + stored user id.",
      },
      { status: 200 }
    );
  }

  const result = await runAdapterSync(supabase, user.id, instagramGraphApiAdapter, {});
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
