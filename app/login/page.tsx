import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; check?: string; reason?: string }>;
}) {
  const params = await searchParams;
  const err = params.error;
  const check = params.check;
  const reason = params.reason;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Single-user analytics. Use the magic link sent to your email.
      </p>
      {err === "unauthorized" && (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          This account is not allowed. Set <code className="font-mono">OWNER_EMAIL</code>{" "}
          to your address or sign in with the owner email.
        </p>
      )}
      {err === "auth" && (
        <div className="mt-4 space-y-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
          <p className="font-medium">Sign-in failed.</p>
          {reason ? (
            <p className="text-xs leading-relaxed opacity-90">
              {(() => {
                try {
                  return decodeURIComponent(reason);
                } catch {
                  return reason;
                }
              })()}
            </p>
          ) : (
            <p className="text-xs">Try requesting a new link. If it still fails, open the email link in the same browser you used to request it (PKCE).</p>
          )}
        </div>
      )}
      {check === "email" && (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
          Check your inbox for the magic link.
        </p>
      )}
      <form className="mt-8 flex flex-col gap-4" action="/auth/sign-in" method="post">
        <label className="text-sm font-medium">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="you@example.com"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Send magic link
        </button>
      </form>
      <p className="mt-6 text-xs text-zinc-500">
        Configure Supabase Auth email in the dashboard. See{" "}
        <Link href="https://supabase.com/docs/guides/auth" className="underline">
          Supabase Auth docs
        </Link>
        .
      </p>
    </div>
  );
}
