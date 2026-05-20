"use client";

import { EngagementChart } from "@/components/EngagementChart";
import { PostsTable } from "@/components/PostsTable";
import type { EngagementDenominator, PostAgg, TrendPoint } from "@/lib/analytics/engagement";

function pct(rate: number | null) {
  if (rate === null) return "—";
  return `${(rate * 100).toFixed(2)}%`;
}

function denominatorHelp(pref: EngagementDenominator) {
  switch (pref) {
    case "impressions":
      return "Denominator: impressions only (rows with 0 impressions show “—”).";
    case "reach":
      return "Denominator: reach only.";
    default:
      return "Denominator: impressions when > 0; otherwise reach.";
  }
}

export function DashboardClient(props: {
  from: string;
  to: string;
  mediaFilter: string;
  denominator: EngagementDenominator;
  trend: TrendPoint[];
  postsAgg: PostAgg[];
  totals: { engagements: number; impressions: number; reach: number; rate: number | null };
  hasData: boolean;
}) {
  const { from, to, mediaFilter, denominator, trend, postsAgg, totals, hasData } = props;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Engagement overview</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{denominatorHelp(denominator)}</p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-zinc-500">From</span>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-zinc-500">To</span>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-zinc-500">Media</span>
          <select
            name="media"
            defaultValue={mediaFilter}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="all">All</option>
            <option value="reel">Reel</option>
            <option value="carousel">Carousel</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Apply
        </button>
      </form>

      {!hasData && (
        <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          No metrics in this range.{" "}
          <a href="/import" className="font-medium text-indigo-600 underline dark:text-indigo-400">
            Import a CSV
          </a>{" "}
          or widen the date range.
        </div>
      )}

      {hasData && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="text-xs font-medium uppercase text-zinc-500">Engagement rate</p>
              <p className="mt-2 text-2xl font-semibold">{pct(totals.rate)}</p>
              <p className="mt-1 text-xs text-zinc-500">Weighted: Σ engagements / Σ denominator</p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="text-xs font-medium uppercase text-zinc-500">Total engagements</p>
              <p className="mt-2 text-2xl font-semibold">{totals.engagements}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="text-xs font-medium uppercase text-zinc-500">Total impressions</p>
              <p className="mt-2 text-2xl font-semibold">{totals.impressions}</p>
              <p className="mt-1 text-xs text-zinc-500">Reach (sum): {totals.reach}</p>
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-medium">Daily engagement rate</h2>
            <EngagementChart data={trend} />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-medium">Posts</h2>
            <PostsTable rows={postsAgg} />
          </section>
        </>
      )}
    </div>
  );
}
