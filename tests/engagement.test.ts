import { describe, expect, it } from "vitest";
import {
  aggregatePeriodTotals,
  aggregateTrendByDay,
  engagementRate,
  pickDenominator,
} from "@/lib/analytics/engagement";

describe("engagement", () => {
  it("pickDenominator impressions_then_reach prefers impressions", () => {
    expect(pickDenominator(100, 200, "impressions_then_reach")).toBe(100);
    expect(pickDenominator(0, 200, "impressions_then_reach")).toBe(200);
  });

  it("engagementRate divides engagements by denominator", () => {
    expect(engagementRate(50, 1000, 800, "impressions_then_reach")).toBeCloseTo(0.05);
  });

  it("aggregateTrendByDay groups by metric_date", () => {
    const trend = aggregateTrendByDay(
      [
        {
          metric_date: "2025-04-01",
          likes: 1,
          comments: 1,
          saves: 1,
          shares: 1,
          impressions: 100,
          reach: 50,
        },
        {
          metric_date: "2025-04-01",
          likes: 2,
          comments: 0,
          saves: 0,
          shares: 0,
          impressions: 100,
          reach: 50,
        },
        {
          metric_date: "2025-04-02",
          likes: 0,
          comments: 0,
          saves: 0,
          shares: 0,
          impressions: 0,
          reach: 40,
        },
      ],
      "impressions_then_reach"
    );
    expect(trend).toHaveLength(2);
    expect(trend[0].engagements).toBe(6);
    expect(trend[1].denominator).toBe(40);
  });

  it("aggregatePeriodTotals weights across rows", () => {
    const totals = aggregatePeriodTotals(
      [
        {
          metric_date: "2025-04-01",
          likes: 10,
          comments: 0,
          saves: 0,
          shares: 0,
          impressions: 100,
          reach: 0,
        },
        {
          metric_date: "2025-04-02",
          likes: 0,
          comments: 5,
          saves: 0,
          shares: 0,
          impressions: 0,
          reach: 50,
        },
      ],
      "impressions_then_reach"
    );
    expect(totals.engagements).toBe(15);
    expect(totals.impressions).toBe(100);
    expect(totals.reach).toBe(50);
    expect(totals.rate).not.toBeNull();
  });
});
