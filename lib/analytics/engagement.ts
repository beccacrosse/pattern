export type EngagementDenominator =
  | "impressions"
  | "reach"
  | "impressions_then_reach";

export type MetricRow = {
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  impressions: number;
  reach: number;
};

/** Sum of interactions used as “engagements” in the MVP. */
export function countEngagements(row: Pick<MetricRow, "likes" | "comments" | "saves" | "shares">) {
  return row.likes + row.comments + row.saves + row.shares;
}

export function pickDenominator(
  impressions: number,
  reach: number,
  pref: EngagementDenominator
): number | null {
  switch (pref) {
    case "impressions":
      return impressions > 0 ? impressions : null;
    case "reach":
      return reach > 0 ? reach : null;
    case "impressions_then_reach":
      if (impressions > 0) return impressions;
      if (reach > 0) return reach;
      return null;
    default:
      return null;
  }
}

export function engagementRate(
  engagements: number,
  impressions: number,
  reach: number,
  pref: EngagementDenominator
): number | null {
  const d = pickDenominator(impressions, reach, pref);
  if (d === null || d === 0) return null;
  return engagements / d;
}

export type DailyMetricInput = MetricRow & { metric_date: string };

export type TrendPoint = {
  date: string;
  engagements: number;
  denominator: number | null;
  rate: number | null;
};

export function aggregateTrendByDay(
  rows: DailyMetricInput[],
  pref: EngagementDenominator
): TrendPoint[] {
  const byDay = new Map<
    string,
    { engagements: number; impressions: number; reach: number }
  >();

  for (const r of rows) {
    const cur = byDay.get(r.metric_date) ?? {
      engagements: 0,
      impressions: 0,
      reach: 0,
    };
    cur.engagements += countEngagements(r);
    cur.impressions += r.impressions;
    cur.reach += r.reach;
    byDay.set(r.metric_date, cur);
  }

  const dates = [...byDay.keys()].sort();
  return dates.map((date) => {
    const { engagements, impressions, reach } = byDay.get(date)!;
    const denominator = pickDenominator(impressions, reach, pref);
    const rate =
      denominator && denominator > 0 ? engagements / denominator : null;
    return { date, engagements, denominator, rate };
  });
}

export type PostAgg = {
  post_uuid: string;
  instagram_post_id: string;
  media_type: string | null;
  caption: string | null;
  posted_at: string | null;
  engagements: number;
  impressions: number;
  reach: number;
  rate: number | null;
};

export function aggregatePerPost(
  rows: Array<
    DailyMetricInput & {
      post_uuid: string;
      instagram_post_id: string;
      media_type: string | null;
      caption: string | null;
      posted_at: string | null;
    }
  >,
  pref: EngagementDenominator
): PostAgg[] {
  const map = new Map<
    string,
    Omit<PostAgg, "rate"> & { impressions: number; reach: number }
  >();

  for (const r of rows) {
    const cur = map.get(r.post_uuid) ?? {
      post_uuid: r.post_uuid,
      instagram_post_id: r.instagram_post_id,
      media_type: r.media_type,
      caption: r.caption,
      posted_at: r.posted_at,
      engagements: 0,
      impressions: 0,
      reach: 0,
    };
    cur.engagements += countEngagements(r);
    cur.impressions += r.impressions;
    cur.reach += r.reach;
    map.set(r.post_uuid, cur);
  }

  return [...map.values()].map((p) => ({
    ...p,
    rate: engagementRate(p.engagements, p.impressions, p.reach, pref),
  }));
}

export function aggregatePeriodTotals(
  rows: DailyMetricInput[],
  pref: EngagementDenominator
) {
  const engagements = rows.reduce((acc, r) => acc + countEngagements(r), 0);
  const impressions = rows.reduce((acc, r) => acc + r.impressions, 0);
  const reach = rows.reduce((acc, r) => acc + r.reach, 0);
  const rate = engagementRate(engagements, impressions, reach, pref);
  return { engagements, impressions, reach, rate };
}
