import { describe, expect, it } from "vitest";
import { shiftIsoDate } from "@/lib/seo-reporting/dates";
import { buildSeoReportResponse } from "@/lib/seo-reporting/report";
import type { SeoReportInput } from "@/lib/seo-reporting/types";

const now = new Date("2026-07-27T12:00:00.000Z");

function dates(start: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => shiftIsoDate(start, index));
}

describe("persisted Yandex SEO history", () => {
  it("reports partial long-period coverage without pretending it is complete", () => {
    const input: SeoReportInput = {
      provider: "yandex",
      period: 90,
      device: "all",
      query: ""
    };
    const report = buildSeoReportResponse({
      input,
      generatedAt: now,
      execution: {
        state: "ok",
        coverageDates: dates("2026-07-13", 14),
        lastCollectedAt: "2026-07-27T03:15:00.000Z",
        dataset: {
          summaryRows: [],
          queryRows: [],
          pageRows: [],
          actualStart: "2026-07-13",
          actualEnd: "2026-07-26",
          truncated: false
        }
      }
    });

    expect(report.requestedDays).toBe(90);
    expect(report.coverageDays).toBe(14);
    expect(report.dateRange).toEqual({
      start: "2026-07-13",
      end: "2026-07-26"
    });
    expect(report.lastCollectedAt).toBe("2026-07-27T03:15:00.000Z");
    expect(report.comparisonRange).toBeUndefined();
  });
});
