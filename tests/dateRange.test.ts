import { describe, expect, it } from "vitest";
import { defaultMetricWeekRange, weekEndingOn } from "@/lib/dashboard/dateRange";

describe("dateRange", () => {
  it("weekEndingOn returns 7 inclusive days", () => {
    expect(weekEndingOn("2025-05-20")).toEqual({ from: "2025-05-14", to: "2025-05-20" });
  });

  it("defaultMetricWeekRange uses latest metric_date", () => {
    expect(defaultMetricWeekRange("2025-05-20")).toEqual({
      from: "2025-05-14",
      to: "2025-05-20",
    });
  });
});
