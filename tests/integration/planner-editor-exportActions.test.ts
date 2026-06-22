import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildExportMeta,
  downloadPlannerBoqPdf,
  downloadPlannerJson,
  PlannerExportError,
  downloadPlannerSvg,
} from "@/features/planner/editor/exportActions";
import { resetFabricRuntimeState, seedFabricRuntime } from "./planner-fabric-mockRuntime";

import * as plannerDocumentBridge from "@/features/planner/document/plannerDocumentBridge";
import * as plannerSession from "@/features/planner/persistence/plannerSession";
import * as pdfExport from "@/features/planner/shared/export/pdfExport";


describe("exportActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div class="pw-canvas-surface"></div>';
    vi.spyOn(plannerDocumentBridge, "buildPlannerDocumentFromEditor").mockReturnValue({ version: 1, shapes: [] } as unknown as ReturnType<typeof plannerDocumentBridge.buildPlannerDocumentFromEditor>);
    vi.spyOn(plannerSession, "buildSessionEnvelope").mockImplementation((snapshot) => ({ snapshot, savedAt: "now" } as ReturnType<typeof plannerSession.buildSessionEnvelope>));
    vi.spyOn(pdfExport, "exportBoqToPdf").mockResolvedValue(undefined);
  });

  afterEach(() => {
    resetFabricRuntimeState();
  });

  it("buildExportMeta reads furniture dimensions from the Fabric snapshot", () => {
    seedFabricRuntime({
      objects: [
        { name: "GENERIC:Desk", left: 10, top: 20, width: 120, height: 60 },
        { name: "CORNER", left: 0, top: 0, width: 4, height: 4 },
        { name: "CORNER", left: 600, top: 0, width: 4, height: 4 },
        { name: "CORNER", left: 600, top: 400, width: 4, height: 4 },
        { name: "CORNER", left: 0, top: 400, width: 4, height: 4 },
      ],
    });

    const meta = buildExportMeta(null);
    expect(meta.furniture[0]).toMatchObject({
      name: "GENERIC:Desk",
      widthMm: 1200,
      depthMm: 600,
      spec: "1200×600×750 mm",
    });
    expect(meta.room).toMatchObject({ widthMm: 6040, depthMm: 4040 });
  });

  it("downloads planner json envelope with exportMeta", () => {
    seedFabricRuntime({
      objects: [{ name: "GENERIC:Desk", left: 0, top: 0, width: 120, height: 60 }],
      runtime: {
        exportSvg: () => "<svg></svg>",
      },
    });

    const click = vi.fn();
    const createElement = vi.spyOn(document, "createElement").mockReturnValue({
      click,
      href: "",
      download: "",
    } as unknown as HTMLAnchorElement);

    downloadPlannerJson(null, "workspace-plan.json");
    expect(click).toHaveBeenCalled();
    createElement.mockRestore();
  });

  it("downloads BOQ pdf through the shared exporter", async () => {
    seedFabricRuntime({
      objects: [{ name: "GENERIC:Desk", left: 0, top: 0, width: 120, height: 60 }],
    });

    await downloadPlannerBoqPdf(null as unknown as Document, "Workspace Plan");
    expect(pdfExport.exportBoqToPdf).toHaveBeenCalled();
  });

  it("throws when SVG export is requested without a room shell", async () => {
    seedFabricRuntime({
      objects: [{ name: "GENERIC:Desk", left: 0, top: 0, width: 120, height: 60 }],
      runtime: { exportSvg: () => null },
    });

    await expect(downloadPlannerSvg(null)).rejects.toBeInstanceOf(PlannerExportError);
  });
});
