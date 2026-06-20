import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BoqSummary } from "@/features/planner/shared/boq/types";
import type { ExportLayout } from "@/features/planner/shared/export/types";

const { html2canvasMock, jsPdfState, MockJsPDF } = vi.hoisted(() => {
  const html2canvasMock = vi.fn();
  const jsPdfState = {
    save: vi.fn(),
    addImage: vi.fn(),
    addPage: vi.fn(),
    rect: vi.fn(),
    text: vi.fn(),
    setFillColor: vi.fn(),
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
  };

  class MockJsPDF {
    internal = {
      pageSize: {
        getWidth: () => 297,
        getHeight: () => 210,
      },
    };

    save = jsPdfState.save;
    addImage = jsPdfState.addImage;
    addPage = jsPdfState.addPage;
    rect = jsPdfState.rect;
    text = jsPdfState.text;
    setFillColor = jsPdfState.setFillColor;
    setFont = jsPdfState.setFont;
    setFontSize = jsPdfState.setFontSize;
    setTextColor = jsPdfState.setTextColor;
  }

  return { html2canvasMock, jsPdfState, MockJsPDF };
});

vi.mock("html2canvas", () => ({
  default: (...args: unknown[]) => html2canvasMock(...args),
}));

vi.mock("jspdf", () => ({
  __esModule: true,
  jsPDF: MockJsPDF,
}));

import {
  downloadCsv,
  downloadJson,
  exportBoqToCsv,
  exportBoqToJson,
  exportBoqToPdf,
} from "@/features/planner/shared/export/index";

describe("planner shared export helpers", () => {
  const layout: ExportLayout = {
    projectName: 'HQ "Alpha", East',
    clientName: "Acme\nStudios",
    preparedBy: "Planner Ops",
    roomWidthMm: 8400,
    roomDepthMm: 6200,
    unitSystem: "metric",
    generatedAt: "2026-06-06T10:20:30.000Z",
  };

  const boq: BoqSummary = {
    lineItems: [
      {
        catalogId: "desk-1",
        name: 'Bench "A", 6P',
        category: "workstations",
        quantity: 2,
        dimensions: {
          widthMm: 3600,
          depthMm: 1200,
          heightMm: 750,
        },
      },
    ],
    totalItems: 2,
    generatedAt: layout.generatedAt,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    html2canvasMock.mockReset();
    Object.values(jsPdfState).forEach((spy) => spy.mockReset());
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
  });

  it("exports BOQ CSV with escaped metadata and line items", () => {
    const csv = exportBoqToCsv(boq, layout);

    expect(csv).toContain('Project,"HQ ""Alpha"", East"');
    expect(csv).toContain('Client,"Acme\nStudios"');
    expect(csv).toContain("Prepared By,Planner Ops");
    expect(csv).toContain("Room,8400mm x 6200mm");
    expect(csv).toContain('workstations,"Bench ""A"", 6P",2,3600,1200,750');
    expect(csv).toContain("Total Items,2");
  });

  it("exports BOQ JSON with the stable wrapper contract", () => {
    expect(exportBoqToJson(boq, layout)).toEqual({
      type: "oando-boq-export",
      version: 1,
      layout,
      boq,
    });
  });

  it("downloads CSV content through a blob link", () => {
    const createObjectURL = vi.mocked(URL.createObjectURL).mockReturnValue("blob:csv-test");
    const revokeObjectURL = vi.mocked(URL.revokeObjectURL).mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    downloadCsv("a,b\n1,2", "boq.csv");

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("text/csv;charset=utf-8;");
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:csv-test");
  });

  it("downloads formatted JSON through a blob link", () => {
    const createObjectURL = vi.mocked(URL.createObjectURL).mockReturnValue("blob:json-test");
    const revokeObjectURL = vi.mocked(URL.revokeObjectURL).mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const payload = exportBoqToJson(boq, layout);

    downloadJson(payload, "boq.json");

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("application/json");
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:json-test");
  });

  it("exports BOQ PDF with canvas imagery and a generated filename", async () => {
    html2canvasMock.mockResolvedValue({
      toDataURL: () => "data:image/png;base64,canvas",
    });

    await exportBoqToPdf({
      layout,
      rows: [
        {
          name: "Bench Desk",
          category: "workstations",
          quantity: 2,
          widthCm: 360,
          depthCm: 120,
          heightCm: 75,
          spec: "6P cluster",
        },
      ],
      canvasElement: document.createElement("div"),
    });

    expect(html2canvasMock).toHaveBeenCalledTimes(1);
    expect(jsPdfState.addImage).toHaveBeenCalledWith(
      "data:image/png;base64,canvas",
      "PNG",
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      undefined,
      "FAST",
    );
    expect(jsPdfState.text).toHaveBeenCalledWith(
      "ONE&ONLY WORKSPACE PLANNER",
      expect.any(Number),
      expect.any(Number),
    );
    expect(jsPdfState.text).toHaveBeenCalledWith(
      expect.stringContaining("Total items: 2"),
      expect.any(Number),
      expect.any(Number),
    );
    expect(jsPdfState.save).toHaveBeenCalledWith('oando-hq-"alpha",-east-plan.pdf');
  });

  it("falls back cleanly when canvas capture fails and respects an explicit pdf filename", async () => {
    html2canvasMock.mockRejectedValue(new Error("capture failed"));

    await exportBoqToPdf({
      layout: {
        ...layout,
        projectName: "",
        clientName: undefined,
        preparedBy: undefined,
        roomWidthMm: 0,
        roomDepthMm: 0,
      },
      rows: new Array(24).fill(null).map((_, index) => ({
        name: `Workstation block ${index} with a very long descriptive label`,
        category: "workstations",
        quantity: 1,
        widthCm: 140,
        depthCm: 70,
        heightCm: 75,
        spec: "Long specification that should be clipped in the pdf renderer",
      })),
      canvasElement: document.createElement("div"),
      fileName: "custom.pdf",
    });

    expect(jsPdfState.addImage).not.toHaveBeenCalled();
    expect(jsPdfState.addPage).toHaveBeenCalled();
    expect(jsPdfState.save).toHaveBeenCalledWith("custom.pdf");
  });
});