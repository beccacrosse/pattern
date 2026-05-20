import { createClient } from "@/lib/supabase/server";
import {
  updateIntegrationFormAction,
  updatePreferenceFormAction,
} from "@/app/actions/settings";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: prefs }, { data: integration }] = await Promise.all([
    supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("instagram_integration").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const denominator = prefs?.engagement_denominator ?? "impressions_then_reach";

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Engagement rate = (likes + comments + saves + shares) ÷ denominator.
        </p>
      </div>

      <section className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-medium">Engagement denominator</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <strong>impressions_then_reach</strong> (default): use impressions when the summed
          impressions for a bucket are &gt; 0; otherwise use reach. Pure{" "}
          <strong>impressions</strong> or <strong>reach</strong> never fall back.
        </p>
        <form action={updatePreferenceFormAction} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            name="engagement_denominator"
            defaultValue={denominator}
            className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="impressions_then_reach">Impressions, else reach</option>
            <option value="impressions">Impressions only</option>
            <option value="reach">Reach only</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Save
          </button>
        </form>
      </section>

      <section className="space-y-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-medium">Instagram Graph API (Phase 2)</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Store non-secret identifiers here. Keep <code className="font-mono">App Secret</code> and{" "}
          <code className="font-mono">User access token</code> in environment variables or a secrets
          manager—never commit them. Cron skeleton:{" "}
          <code className="font-mono">GET /api/cron/instagram-sync</code> with{" "}
          <code className="font-mono">Authorization: Bearer CRON_SECRET</code>.
        </p>
        <form action={updateIntegrationFormAction} className="space-y-3">
          <label className="block text-sm">
            Facebook App ID
            <input
              name="facebook_app_id"
              defaultValue={integration?.facebook_app_id ?? ""}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="block text-sm">
            Instagram Business Account ID
            <input
              name="instagram_business_account_id"
              defaultValue={integration?.instagram_business_account_id ?? ""}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="block text-sm">
            Access token hint (e.g. last 4 chars; optional)
            <input
              name="access_token_hint"
              defaultValue={integration?.access_token_hint ?? ""}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <p className="text-xs text-zinc-500">
            Token status (read-only): {integration?.token_status ?? "not_configured"}
          </p>
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Save integration fields
          </button>
        </form>
      </section>
    </div>
  );
}
