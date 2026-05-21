import type { SupabaseClient } from "@supabase/supabase-js";
import { parseJobSnapshot, type ImportJobSnapshot } from "@/lib/import/jobSnapshot";

export type ImportJobView = {
  id: string;
  filename: string | null;
  status: string;
  row_count: number;
  errors: unknown;
  created_at: string;
} & ImportJobSnapshot;

const FULL_SELECT =
  "id, filename, status, row_count, posts_touched, errors, created_at, column_mapping, headers, preview_rows";

const BASE_SELECT = "id, filename, status, row_count, errors, created_at";

function toJobView(row: Record<string, unknown>): ImportJobView {
  const snapshot = parseJobSnapshot(row);
  return {
    id: String(row.id),
    filename: (row.filename as string | null) ?? null,
    status: String(row.status),
    row_count: Number(row.row_count ?? 0),
    errors: row.errors,
    created_at: String(row.created_at),
    ...snapshot,
  };
}

function isMissingColumnError(message: string | undefined) {
  if (!message) return false;
  return (
    message.includes("column_mapping") ||
    message.includes("preview_rows") ||
    message.includes("posts_touched") ||
    message.includes("does not exist")
  );
}

export async function loadImportJobs(
  supabase: SupabaseClient,
  userId: string,
  limit = 15
): Promise<ImportJobView[]> {
  const full = await supabase
    .from("import_jobs")
    .select(FULL_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!full.error && full.data) {
    return full.data.map((row) => toJobView(row as Record<string, unknown>));
  }

  if (!isMissingColumnError(full.error?.message)) {
    return [];
  }

  const base = await supabase
    .from("import_jobs")
    .select(BASE_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (base.error || !base.data) {
    return [];
  }

  return base.data.map((row) => toJobView(row as Record<string, unknown>));
}

export async function loadImportJob(
  supabase: SupabaseClient,
  userId: string,
  jobId: string
): Promise<ImportJobView | null> {
  const jobs = await loadImportJobs(supabase, userId, 50);
  return jobs.find((j) => j.id === jobId) ?? null;
}
