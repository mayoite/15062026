import { describe, expect, it } from "vitest";

import {
  BLUEPRINT_MAX_BYTES,
  getBlueprintImportKind,
  validateBlueprintImportFile,
} from "@/features/planner/editor/blueprintImport";

describe("blueprintImport", () => {
  it("detects supported image and pdf files", () => {
    expect(getBlueprintImportKind({ type: "image/png" } as File)).toBe("image");
    expect(getBlueprintImportKind({ type: "image/webp" } as File)).toBe("image");
    expect(getBlueprintImportKind({ type: "application/pdf" } as File)).toBe("pdf");
  });

  it("rejects unsupported file types", () => {
    expect(getBlueprintImportKind({ type: "text/plain" } as File)).toBe("unsupported");
  });

  it("validates missing, oversized, and supported files", () => {
    expect(validateBlueprintImportFile(null)).toEqual({
      ok: false,
      reason: "missing",
    });

    expect(
      validateBlueprintImportFile({ type: "application/pdf", size: BLUEPRINT_MAX_BYTES + 1 } as File),
    ).toEqual({
      ok: false,
      reason: "too-large",
    });

    expect(
      validateBlueprintImportFile({ type: "application/pdf", size: BLUEPRINT_MAX_BYTES } as File),
    ).toEqual({
      ok: true,
      kind: "pdf",
    });
  });
});
