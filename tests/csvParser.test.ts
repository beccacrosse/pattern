import { describe, expect, it } from "vitest";
import { parseAndNormalizeCsv, parseMetricDate, suggestMapping } from "@/lib/import/csvParser";

describe("csvParser", () => {
  it("parseMetricDate handles ISO and US formats", () => {
    expect(parseMetricDate("2025-04-05")).toBe("2025-04-05");
    expect(parseMetricDate("2025-04-05T12:00:00Z")).toBe("2025-04-05");
    expect(parseMetricDate("4/5/2025")).toBe("2025-04-05");
  });

  it("suggestMapping maps common synonyms", () => {
    const headers = ["Media ID", "Day", "Views", "Accounts Reached", "Like Count"];
    const m = suggestMapping(headers);
    expect(m.post_id).toBeDefined();
    expect(m.metric_date).toBeDefined();
  });

  it("parseAndNormalizeCsv is idempotent for same post/date re-import rows", () => {
    const csv = `post_id,metric_date,impressions,reach,likes,comments,saves,shares
a1,2025-04-01,10,8,1,1,0,0
a1,2025-04-01,10,8,2,0,0,0
`;
    const { rows, errors } = parseAndNormalizeCsv(csv, {});
    expect(errors.length).toBe(0);
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.post_id === "a1")).toBe(true);
  });
});
