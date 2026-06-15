import { describe, expect, it } from "vitest";

import { clampBlueprintPdfPage } from "@/features/planner/editor/blueprintPdfSession";

describe("clampBlueprintPdfPage", () => {
  it("clamps page numbers within the document range", () => {
    expect(clampBlueprintPdfPage(0, 5)).toBe(1);
    expect(clampBlueprintPdfPage(3, 5)).toBe(3);
    expect(clampBlueprintPdfPage(9, 5)).toBe(5);
  });

  it("falls back safely for invalid values", () => {
    expect(clampBlueprintPdfPage(Number.NaN, 5)).toBe(1);
    expect(clampBlueprintPdfPage(2, 0)).toBe(1);
  });
});
