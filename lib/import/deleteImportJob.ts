import type { SupabaseClient } from "@supabase/supabase-js";

export type DeleteImportJobResult = {
  ok: boolean;
  message: string;
  metricsRemoved?: number;
  postsRemoved?: number;
};

export async function deleteImportJob(
  supabase: SupabaseClient,
  userId: string,
  jobId: string
): Promise<DeleteImportJobResult> {
  const { data: job, error: jobError } = await supabase
    .from("import_jobs")
    .select("id, filename")
    .eq("id", jobId)
    .eq("user_id", userId)
    .maybeSingle();

  if (jobError) {
    return { ok: false, message: jobError.message };
  }
  if (!job) {
    return { ok: false, message: "Import not found" };
  }

  const { data: linkedMetrics, error: metricsError } = await supabase
    .from("post_metrics_daily")
    .select("post_uuid, import_job_id")
    .eq("import_job_id", jobId)
    .eq("user_id", userId);

  if (metricsError && metricsError.message.includes("import_job_id")) {
    return deleteJobRow(supabase, userId, jobId, job.filename, {
      metricsRemoved: 0,
      postsRemoved: 0,
      metricsNote:
        " Run the import_job_metrics_link migration to also delete dashboard metrics from this file.",
    });
  }

  if (metricsError) {
    return { ok: false, message: metricsError.message };
  }

  const postUuids = [...new Set((linkedMetrics ?? []).map((m) => m.post_uuid))];
  const metricsRemoved = linkedMetrics?.length ?? 0;

  const deleted = await deleteJobRow(supabase, userId, jobId, job.filename, {
    metricsRemoved,
    postsRemoved: 0,
  });
  if (!deleted.ok) {
    return deleted;
  }

  let postsRemoved = 0;
  for (const postUuid of postUuids) {
    const { count, error: countError } = await supabase
      .from("post_metrics_daily")
      .select("*", { count: "exact", head: true })
      .eq("post_uuid", postUuid)
      .eq("user_id", userId);

    if (countError) continue;
    if (count === 0) {
      const { error: postDeleteError } = await supabase
        .from("posts")
        .delete()
        .eq("id", postUuid)
        .eq("user_id", userId);
      if (!postDeleteError) postsRemoved += 1;
    }
  }

  const label = job.filename ? `"${job.filename}"` : "this import";
  return {
    ok: true,
    message: `Removed ${label}: ${metricsRemoved} metric row${metricsRemoved === 1 ? "" : "s"}${postsRemoved ? ` and ${postsRemoved} post${postsRemoved === 1 ? "" : "s"} with no remaining metrics` : ""}.`,
    metricsRemoved,
    postsRemoved,
  };
}

async function deleteJobRow(
  supabase: SupabaseClient,
  userId: string,
  jobId: string,
  filename: string | null,
  opts: { metricsRemoved: number; postsRemoved: number; metricsNote?: string }
): Promise<DeleteImportJobResult> {
  const { data, error } = await supabase
    .from("import_jobs")
    .delete()
    .eq("id", jobId)
    .eq("user_id", userId)
    .select("id");

  if (error) {
    return { ok: false, message: error.message };
  }
  if (!data?.length) {
    return {
      ok: false,
      message:
        "Could not delete this import. Add the import_jobs delete policy in Supabase (see import_job_metrics_link migration).",
    };
  }

  const label = filename ? `"${filename}"` : "this import";
  const metricsPart =
    opts.metricsRemoved > 0
      ? `: ${opts.metricsRemoved} metric row${opts.metricsRemoved === 1 ? "" : "s"}`
      : opts.metricsNote ?? "";
  const postsPart =
    opts.postsRemoved > 0
      ? ` and ${opts.postsRemoved} post${opts.postsRemoved === 1 ? "" : "s"} with no remaining metrics`
      : "";

  return {
    ok: true,
    message: `Removed ${label}${metricsPart}${postsPart}.`,
    metricsRemoved: opts.metricsRemoved,
    postsRemoved: opts.postsRemoved,
  };
}
