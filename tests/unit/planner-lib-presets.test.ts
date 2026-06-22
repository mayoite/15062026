import { describe, expect, it } from "vitest";

import { EXPORT_PRESETS, getExportPreset } from "@/features/planner/lib/exportPresets";
import { getFinishesForCategory, OANDO_FINISHES } from "@/features/planner/lib/finishVariants";
import {
  DEFAULT_LIGHTING_PRESET,
  DEFAULT_MATERIAL_PRESET,
  getLightingPreset,
  getMaterialPreset,
  LIGHTING_PRESET_LIST,
  MATERIAL_PRESET_LIST,
} from "@/features/planner/lib/lightingPresets";
import {
  createParametricBlock,
  PARAMETRIC_BLOCKS,
  subdivideStorageRun,
} from "@/features/planner/lib/parametricBlocks";

describe("planner preset libraries", () => {
  it("returns branded export presets by id", () => {
    expect(getExportPreset("proposal")).toEqual(EXPORT_PRESETS.proposal);
    expect(getExportPreset("technical").showDimensions).toBe(true);
    expect(getExportPreset("client-presentation").paperSize).toBe("A4-landscape");
  });

  it("filters finish variants by furniture category", () => {
    const seating = getFinishesForCategory("seating");
    expect(seating.every((finish) => ["fabric", "metal", "wood"].includes(finish.category))).toBe(true);
    expect(getFinishesForCategory("unknown-category")).toEqual(OANDO_FINISHES);
  });

  it("returns material and lighting presets with defaults", () => {
    expect(getMaterialPreset("concrete").id).toBe("concrete");
    expect(getMaterialPreset(undefined).id).toBe("wood");
    expect(getLightingPreset("night").pointLights.length).toBeGreaterThan(0);
    expect(getLightingPreset(undefined).id).toBe("day");
    expect(MATERIAL_PRESET_LIST.length).toBe(3);
    expect(LIGHTING_PRESET_LIST.length).toBe(3);
    expect(DEFAULT_MATERIAL_PRESET).toBe("wood");
    expect(DEFAULT_LIGHTING_PRESET).toBe("day");
  });

  it("creates clamped parametric blocks and subdivides storage runs", () => {
    const worktop = PARAMETRIC_BLOCKS.find((block) => block.type === "worktop");
    expect(worktop).toBeDefined();

    const block = createParametricBlock(worktop!, 9999, 700);
    expect(block.widthMm).toBe(worktop!.maxWidthMm);
    expect(block.category).toBe("desks");
    expect(block.sku).toContain("WORKTOP");

    expect(subdivideStorageRun(4800, 400)).toBe(12);
    expect(subdivideStorageRun(0, 400)).toBe(0);
    expect(subdivideStorageRun(4800, 0)).toBe(0);
  });
});
