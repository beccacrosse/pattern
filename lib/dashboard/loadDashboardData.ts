import { createClient } from "@/lib/supabase/server";
import type { EngagementDenominator } from "@/lib/analytics/engagement";
import {
  aggregatePerPost,
  aggregatePeriodTotals,
  aggregateTrendByDay,
} from "@/lib/analytics/engagement";
import { defaultMetricWeekRange } from "@/lib/dashboard/dateRange";

export type DashboardSearchParams = {
  from?: string;
  to?: string;
  media?: string;
};

export async function loadDashboardData(searchParams: DashboardSearchParams) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null as null };
  }

  const { data: latestMetric } = await supabase
    .from("post_metrics_daily")
    .select("metric_date")
    .eq("user_id", user.id)
    .order("metric_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const defaults = defaultMetricWeekRange(latestMetric?.metric_date ?? null);
  const fromStr = searchParams.from ?? defaults.from;
  const toStr = searchParams.to ?? defaults.to;
  const usingDefaultRange = !searchParams.from && !searchParams.to;

  const { data: prefRow } = await supabase
    .from("user_preferences")
    .select("engagement_denominator")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!prefRow) {
    await supabase.from("user_preferences").insert({
      user_id: user.id,
      engagement_denominator: "impressions_then_reach",
    });
  }

  const denominator = (prefRow?.engagement_denominator ??
    "impressions_then_reach") as EngagementDenominator;

  const { data: metrics, error: metricsError } = await supabase
    .from("post_metrics_daily")
    .select(
      "metric_date, impressions, reach, likes, comments, saves, shares, post_uuid"
    )
    .eq("user_id", user.id)
    .gte("metric_date", fromStr)
    .lte("metric_date", toStr);

  if (metricsError) {
    throw new Error(metricsError.message);
  }

  const postUuids = [...new Set((metrics ?? []).map((m) => m.post_uuid))];
  let posts: Array<{
    id: string;
    post_id: string;
    media_type: string | null;
    caption: string | null;
    posted_at: string | null;
  }> = [];

  if (postUuids.length) {
    const { data: postsData, error: postsError } = await supabase
      .from("posts")
      .select("id, post_id, media_type, caption, posted_at")
      .eq("user_id", user.id)
      .in("id", postUuids);

    if (postsError) {
      throw new Error(postsError.message);
    }
    posts = postsData ?? [];
  }

  const postMap = new Map(posts.map((p) => [p.id, p]));
  const mediaFilter = (searchParams.media ?? "all").toLowerCase();

  const joined = (metrics ?? [])
    .map((m) => {
      const p = postMap.get(m.post_uuid);
      if (!p) return null;
      return {
        metric_date: m.metric_date,
        impressions: m.impressions ?? 0,
        reach: m.reach ?? 0,
        likes: m.likes ?? 0,
        comments: m.comments ?? 0,
        saves: m.saves ?? 0,
        shares: m.shares ?? 0,
        post_uuid: m.post_uuid,
        instagram_post_id: p.post_id,
        media_type: p.media_type,
        caption: p.caption,
        posted_at: p.posted_at,
      };
    })
    .filter(Boolean) as Array<{
    metric_date: string;
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    saves: number;
    shares: number;
    post_uuid: string;
    instagram_post_id: string;
    media_type: string | null;
    caption: string | null;
    posted_at: string | null;
  }>;

  const filtered =
    mediaFilter === "all"
      ? joined
      : joined.filter(
          (r) => (r.media_type ?? "").toLowerCase() === mediaFilter
        );

  const trend = aggregateTrendByDay(filtered, denominator);
  const postsAgg = aggregatePerPost(filtered, denominator).sort((a, b) => {
    const ar = a.rate ?? -1;
    const br = b.rate ?? -1;
    return br - ar;
  });

  const totals = aggregatePeriodTotals(filtered, denominator);

  return {
    user,
    from: fromStr,
    to: toStr,
    usingDefaultRange,
    latestMetricDate: latestMetric?.metric_date ?? null,
    mediaFilter,
    denominator,
    trend,
    postsAgg,
    totals,
    hasData: filtered.length > 0,
  };
}
