import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteImportJob } from "@/lib/import/deleteImportJob";

describe("deleteImportJob", () => {
  it("deletes job and metrics linked by import_job_id", async () => {
    const jobDelete = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(async () => ({ data: [{ id: "job-1" }], error: null })),
        })),
      })),
    }));
    const metricsSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(async () => ({
          data: [{ post_uuid: "post-1" }],
          error: null,
        })),
      })),
    }));
    const metricsCount = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(async () => ({ count: 0, error: null })),
      })),
    }));
    const postsDelete = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(async () => ({ error: null })),
      })),
    }));

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "import_jobs") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({
                    data: { id: "job-1", filename: "demo.csv" },
                    error: null,
                  })),
                })),
              })),
            })),
            delete: jobDelete,
          };
        }
        if (table === "post_metrics_daily") {
          return {
            select: vi.fn((cols: string, opts?: { count?: string; head?: boolean }) => {
              if (opts?.count) return metricsCount();
              return metricsSelect();
            }),
          };
        }
        if (table === "posts") {
          return { delete: postsDelete };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient;

    const result = await deleteImportJob(supabase, "user-1", "job-1");
    expect(result.ok).toBe(true);
    expect(result.metricsRemoved).toBe(1);
    expect(jobDelete).toHaveBeenCalled();
  });
});
