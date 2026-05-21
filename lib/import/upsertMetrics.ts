import type { SupabaseClient } from "@supabase/supabase-js";
import type { NormalizedImportRow } from "@/lib/import/types";

function parseOptionalTimestamp(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export type UpsertSummary = {
  postsTouched: number;
  metricsUpserted: number;
  errors: string[];
};

export async function upsertImportRows(
  supabase: SupabaseClient,
  userId: string,
  rows: NormalizedImportRow[],
  importJobId?: string
): Promise<UpsertSummary> {
  const errors: string[] = [];
  let postsTouched = 0;
  let metricsUpserted = 0;

  for (const row of rows) {
    const postedAt = parseOptionalTimestamp(row.posted_at);

    const { data: post, error: postError } = await supabase
      .from("posts")
      .upsert(
        {
          user_id: userId,
          post_id: row.post_id,
          media_type: row.media_type,
          caption: row.caption,
          posted_at: postedAt,
          permalink: row.permalink,
        },
        { onConflict: "user_id,post_id" }
      )
      .select("id")
      .single();

    if (postError || !post) {
      errors.push(`Post ${row.post_id}: ${postError?.message ?? "unknown error"}`);
      continue;
    }

    postsTouched += 1;

    const metricPayload: Record<string, unknown> = {
      user_id: userId,
      post_uuid: post.id,
      metric_date: row.metric_date,
      impressions: row.impressions,
      reach: row.reach,
      likes: row.likes,
      comments: row.comments,
      saves: row.saves,
      shares: row.shares,
    };
    if (importJobId) {
      metricPayload.import_job_id = importJobId;
    }

    const { error: metricError } = await supabase
      .from("post_metrics_daily")
      .upsert(metricPayload, { onConflict: "user_id,post_uuid,metric_date" });

    if (metricError) {
      errors.push(`Metrics ${row.post_id} ${row.metric_date}: ${metricError.message}`);
      continue;
    }

    metricsUpserted += 1;
  }

  return { postsTouched, metricsUpserted, errors };
}
