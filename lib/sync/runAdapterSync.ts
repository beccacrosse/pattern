import type { SupabaseClient } from "@supabase/supabase-js";
import type { DataSourceAdapter } from "@/lib/data-sources/types";

/**
 * Skeleton used by cron / future Graph API sync. Logs to `sync_job_logs`.
 */
export async function runAdapterSync(
  supabase: SupabaseClient,
  userId: string,
  adapter: DataSourceAdapter,
  input: unknown
): Promise<{ ok: boolean; message: string }> {
  const { data: log, error: logError } = await supabase
    .from("sync_job_logs")
    .insert({
      user_id: userId,
      source: adapter.id,
      status: "started",
      detail: {},
    })
    .select("id")
    .single();

  if (logError || !log) {
    return { ok: false, message: logError?.message ?? "Could not write sync log" };
  }

  try {
    await adapter.fetchNormalizedRows(input);
    await supabase
      .from("sync_job_logs")
      .update({
        status: "completed",
        detail: { message: "Adapter finished (no-op for Graph API stub)" },
      })
      .eq("id", log.id);

    return { ok: true, message: "Sync completed" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    await supabase
      .from("sync_job_logs")
      .update({
        status: "failed",
        detail: { message: msg },
      })
      .eq("id", log.id);

    return { ok: false, message: msg };
  }
}
