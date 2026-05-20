import type { NormalizedImportRow } from "@/lib/import/types";

/**
 * Shared contract for CSV import today and Instagram Graph API sync later.
 * Implementations return rows already normalized to DB field shapes.
 */
export type DataSourceAdapter = {
  id: string;
  label: string;
  fetchNormalizedRows: (input: unknown) => Promise<NormalizedImportRow[]>;
};

export type SyncJobDetail = {
  message?: string;
  postsUpserted?: number;
  metricsUpserted?: number;
};
