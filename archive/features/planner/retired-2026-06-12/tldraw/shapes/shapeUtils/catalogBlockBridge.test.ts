import {
  normalizeCatalogMm,
  plannerCanvasUnits,
} from "./catalogBlockBridge";

describe("planner canvas units", () => {
  it("keeps catalog cm on the canvas (120 cm desk)", () => {
    expect(plannerCanvasUnits(120)).toBe(120);
    expect(normalizeCatalogMm(120)).toBe(1200);
  });

  it("keeps large room footprints in cm (600 cm boardroom)", () => {
    expect(plannerCanvasUnits(600)).toBe(600);
    expect(normalizeCatalogMm(600)).toBe(6000);
  });

  it("repairs mistaken ×10 placement values from autosave", () => {
    expect(plannerCanvasUnits(1200)).toBe(120);
    expect(plannerCanvasUnits(2500)).toBe(250);
  });
});
