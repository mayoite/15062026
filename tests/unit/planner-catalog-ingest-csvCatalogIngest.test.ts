import * as fs from "fs";
import * as path from "path";

import {
  CSV_DIR,
  PLANNER_CSV_FILES,
  dedupeCatalogItems,
  parseCsvFile,
  rowToCatalogItem,
  toCatalogDim,
} from "@/features/planner/catalog/ingest/csvCatalogIngest";

describe("csvCatalogIngest", () => {
  it("converts mm to catalog dim units", () => {
    expect(toCatalogDim(1200)).toBe(120);
    expect(toCatalogDim(600)).toBe(60);
    expect(toCatalogDim(400)).toBe(400);
  });

  it("parses linear workstation CSV rows", () => {
    const csvPath = path.join(
      process.cwd(),
      "features/planner/catalog/ingest/csv/Workstation and basic storages website.csv",
    );
    if (!fs.existsSync(csvPath)) return;
    const raw = fs.readFileSync(csvPath, "utf8");
    const items = parseCsvFile("website.csv", raw);
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].category).toBe("desks");
    expect(items.some((i) => i.seatCount && i.seatCount > 1)).toBe(true);
  });

  it("maps workstation row to catalog item with bench shape for sharing", () => {
    const item = rowToCatalogItem(
      {
        series: "Linear",
        name: "4 seater - SH (1200mm)",
        seaters: 4,
        lengthMm: 1200,
        depthMm: 1200,
        isSharing: true,
        shape: "straight",
      },
      0,
    );
    expect(item.shapeType).toBe("planner-bench");
    expect(item.widthMm).toBe(480);
    expect(item.heightMm).toBe(120);
    expect(item.seatCount).toBe(4);
  });

  it("parses inline linear, cabin, accessory, and l-shape CSV fixtures", () => {
    const linearCsv = `PRODUCT: LINEAR WORKSTATION
WORKSTATION: SHARING
1,4 seater - SH,1200
,,2400
WORKSTATION: NON SHARING
2,1 seater - NS,1200`;
    const linearItems = parseCsvFile("linear.csv", linearCsv);
    expect(linearItems.length).toBeGreaterThan(1);
    expect(linearItems.some((item) => item.seatCount === 4)).toBe(true);

    const cabinCsv = `CABIN TABLES
1,Executive Desk,1200 X 800`;
    const cabinItems = parseCsvFile("cabins.csv", cabinCsv);
    expect(cabinItems[0].seatCount).toBe(1);
    expect(cabinItems[0].name).toContain("Executive Desk");

    const accessoriesCsv = `PRODUCT: ACCESSORIES
SL NO,item name
SCREEN & PARTITION
1,Privacy Screen
KEYBOARD
2,Keyboard Tray
CPU
3,CPU Holder`;
    const accessoryItems = parseCsvFile("accessories.csv", accessoriesCsv);
    expect(accessoryItems.length).toBeGreaterThan(0);
    expect(accessoryItems.every((item) => item.category === "equipment")).toBe(true);

    const lShapeCsv = `PRODUCT: NEO L SHAPE WORKSTATION
L SHAPE WORKSTATION
L1 x L2
WORKSTATION: SHARING
1,4 seater - SH,
,,1200,2400,X,1200`;
    const lShapeItems = parseCsvFile("lshape.csv", lShapeCsv);
    expect(lShapeItems.length).toBeGreaterThan(0);
    expect(lShapeItems[0].tags).toContain("l-shape");
  });

  it("maps l-shape and solo desk rows to catalog items", () => {
    const lShape = rowToCatalogItem(
      {
        series: "Neo",
        name: "4 seater - SH L (2400mm)",
        seaters: 4,
        lengthMm: 2400,
        depthMm: 1200,
        armLengthMm: 1200,
        isSharing: true,
        shape: "l-shape",
      },
      1,
    );
    expect(lShape.shapeType).toBe("planner-bench");
    expect(lShape.widthMm).toBe(240);

    const soloDesk = rowToCatalogItem(
      {
        series: "Linear",
        name: "1 seater - NS (1200mm)",
        seaters: 1,
        lengthMm: 1200,
        depthMm: 600,
        isSharing: false,
        shape: "straight",
      },
      0,
    );
    expect(soloDesk.shapeType).toBe("planner-desk");
    expect(soloDesk.widthMm).toBe(120);
  });

  it("covers remaining CSV parser branches for series, inline l-shape, and empty files", () => {
    const inlineLShape = `LINEAR SERIES HEADER
WORKSTATION: NON SHARING
1,2 seater - NS,1200
1200 - 900 X 600`;
    const inlineItems = parseCsvFile("inline-lshape.csv", inlineLShape);
    expect(inlineItems.some((item) => item.tags.includes("l-shape"))).toBe(true);

    const lengthOnly = `PRODUCT: LINEAR
WORKSTATION: SHARING
1,2 seater - SH,1200
,,1800`;
    const extended = parseCsvFile("length-only.csv", lengthOnly);
    expect(extended.some((item) => item.name.includes("1800mm"))).toBe(true);

    const seriesFallback = `ACME WORKSTATION SERIES
WORKSTATION: NON SHARING
1,1 seater - NS,1200`;
    const fallbackSeries = parseCsvFile("series.csv", seriesFallback);
    expect(fallbackSeries[0]?.name).toContain("ACME WORKSTATION SERIES");

    const lShapeFallback = `PRODUCT: L SHAPE DESK
L SHAPE WORKSTATION
WORKSTATION: NON SHARING
1,2 seater - NS,
,,900,1200,X,600`;
    const fallbackItems = parseCsvFile("lshape-fallback.csv", lShapeFallback);
    expect(fallbackItems.length).toBeGreaterThan(0);

    expect(parseCsvFile("empty.csv", "no recognizable rows here")).toEqual([]);
  });

  it("dedupes catalog items and exposes ingest constants", () => {
    const item = rowToCatalogItem(
      {
        series: "Linear",
        name: "1 seater - NS (1200mm)",
        seaters: 1,
        lengthMm: 1200,
        depthMm: 600,
        isSharing: false,
        shape: "straight",
      },
      0,
    );
    const deduped = dedupeCatalogItems([item, { ...item }]);
    expect(deduped).toHaveLength(1);
    expect(CSV_DIR).toContain("features/planner/catalog/ingest/csv");
    expect(PLANNER_CSV_FILES.length).toBeGreaterThan(5);
  });
});

