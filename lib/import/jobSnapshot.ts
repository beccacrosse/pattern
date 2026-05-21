import type { CsvColumnMapping } from "@/lib/import/types";
import { STANDARD_COLUMNS } from "@/lib/import/types";

export type ImportJobSnapshot = {
  column_mapping: CsvColumnMapping | null;
  headers: string[];
  preview_rows: Record<string, string>[];
  posts_touched: number;
};

export function parseJobSnapshot(job: {
  column_mapping?: unknown;
  headers?: unknown;
  preview_rows?: unknown;
  posts_touched?: number | null;
}): ImportJobSnapshot {
  const headers = Array.isArray(job.headers)
    ? job.headers.filter((h): h is string => typeof h === "string")
    : [];
  const preview_rows = Array.isArray(job.preview_rows)
    ? job.preview_rows.filter(
        (r): r is Record<string, string> =>
          typeof r === "object" && r !== null && !Array.isArray(r)
      )
    : [];
  const column_mapping =
    job.column_mapping && typeof job.column_mapping === "object" && !Array.isArray(job.column_mapping)
      ? (job.column_mapping as CsvColumnMapping)
      : null;

  return {
    column_mapping,
    headers,
    preview_rows,
    posts_touched: job.posts_touched ?? 0,
  };
}

export { STANDARD_COLUMNS };
