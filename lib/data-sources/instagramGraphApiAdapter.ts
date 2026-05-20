import type { DataSourceAdapter } from "@/lib/data-sources/types";
import type { NormalizedImportRow } from "@/lib/import/types";

/**
 * Placeholder for Instagram Graph API (Business/Creator + Facebook app).
 * Wire Meta OAuth + `/me/media` + insights in Phase 2.
 */
export const instagramGraphApiAdapter: DataSourceAdapter = {
  id: "instagram_graph_api",
  label: "Instagram Graph API",
  async fetchNormalizedRows(): Promise<NormalizedImportRow[]> {
    throw new Error(
      "Instagram Graph API sync is not enabled yet. Use CSV import or configure sync in Phase 2."
    );
  },
};
