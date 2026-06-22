import { describe, expect, it } from "vitest";

import { formatDate } from "@/features/planner/canvas-fabric/lib/formatDate";

describe("canvas-fabric formatDate", () => {
  it("replaces all token placeholders with padded date parts", () => {
    const date = new Date(2026, 0, 7, 8, 9, 5);
    expect(formatDate(date, "yyyy-MM-dd-hh-mm-ss", "en")).toBe("2026-01-07-08-09-05");
  });

  it("pads single-digit month, day, hour, minute, second", () => {
    const date = new Date(2026, 2, 1, 1, 2, 3);
    expect(formatDate(date, "yyyy-MM-dd hh:mm:ss", "en")).toBe("2026-03-01 01:02:03");
  });

  it("leaves unmatched characters untouched", () => {
    const date = new Date(2026, 5, 20, 14, 30, 45);
    expect(formatDate(date, "yyyy/MM/dd at hh:mm:ss", "en")).toBe("2026/06/20 at 14:30:45");
  });

  it("does not double-replace yyyy when year already contains MM-like digits", () => {
    // Year 2026 — ensure 'yyyy' consumes the whole year, not just '20'.
    const date = new Date(2026, 10, 25, 23, 59, 59);
    expect(formatDate(date, "yyyy-MM-dd", "en")).toBe("2026-11-25");
  });
});

