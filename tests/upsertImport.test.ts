import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { upsertImportRows } from "@/lib/import/upsertMetrics";
import type { NormalizedImportRow } from "@/lib/import/types";

describe("upsertImportRows", () => {
  it("calls metrics upsert once per CSV row (DB unique constraint collapses duplicates)", async () => {
    const metricsUpsert = vi.fn(async () => ({ error: null }));

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "posts") {
          return {
            upsert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: { id: "post-uuid-1" },
                  error: null,
                })),
              })),
            })),
          };
        }
        if (table === "post_metrics_daily") {
          return { upsert: metricsUpsert };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient;

    const rows: NormalizedImportRow[] = [
      {
        post_id: "A",
        metric_date: "2025-04-01",
        impressions: 10,
        reach: 5,
        likes: 1,
        comments: 0,
        saves: 0,
        shares: 0,
        media_type: null,
        caption: null,
        posted_at: null,
        permalink: null,
      },
      {
        post_id: "A",
        metric_date: "2025-04-01",
        impressions: 99,
        reach: 1,
        likes: 2,
        comments: 0,
        saves: 0,
        shares: 0,
        media_type: null,
        caption: null,
        posted_at: null,
        permalink: null,
      },
    ];

    const summary = await upsertImportRows(supabase, "user-1", rows);
    expect(summary.metricsUpserted).toBe(2);
    expect(metricsUpsert).toHaveBeenCalledTimes(2);
    expect(summary.errors.length).toBe(0);
  });
});
