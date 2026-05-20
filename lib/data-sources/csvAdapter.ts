import type { DataSourceAdapter } from "@/lib/data-sources/types";
import type { CsvColumnMapping, NormalizedImportRow } from "@/lib/import/types";
import { parseAndNormalizeCsv } from "@/lib/import/csvParser";

export const csvAdapter: DataSourceAdapter = {
  id: "csv",
  label: "CSV import",
  async fetchNormalizedRows(input: unknown): Promise<NormalizedImportRow[]> {
    if (typeof input === "string") {
      const { rows } = parseAndNormalizeCsv(input, {});
      return rows;
    }
    if (input && typeof input === "object" && "csvText" in input) {
      const { csvText, mapping } = input as {
        csvText: string;
        mapping?: CsvColumnMapping;
      };
      const { rows } = parseAndNormalizeCsv(csvText, mapping ?? {});
      return rows;
    }
    throw new Error(
      "CSV adapter expects either raw CSV text or { csvText, mapping? }"
    );
  },
};
