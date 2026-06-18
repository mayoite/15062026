import { getPlannerFabricRuntimeState } from "@/features/planner/canvas-fabric";

type RectLike = {
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

const FABRIC_TO_MM = 10;

function readFurnitureRects(): RectLike[] {
  const serializedDraft = getPlannerFabricRuntimeState().serializedDraft;
  if (!serializedDraft) return [];

  try {
    const snapshot = JSON.parse(serializedDraft) as { objects?: Array<Record<string, unknown>> };
    return (snapshot.objects ?? [])
      .map((object) => ({
        name: String(object.name ?? "Item"),
        left: Number(object.left) || 0,
        top: Number(object.top) || 0,
        width: Number(object.width) || 0,
        height: Number(object.height) || 0,
      }))
      .filter((item) => item.name.startsWith("GENERIC:") || item.name.startsWith("TABLE") || item.name.startsWith("DESK"));
  } catch {
    return [];
  }
}

function overlaps(a: RectLike, b: RectLike) {
  return (
    a.left < b.left + b.width
    && a.left + a.width > b.left
    && a.top < b.top + b.height
    && a.top + a.height > b.top
  );
}

function rectGapMm(a: RectLike, b: RectLike): number | null {
  const gapX =
    a.left + a.width <= b.left
      ? b.left - (a.left + a.width)
      : b.left + b.width <= a.left
        ? a.left - (b.left + b.width)
        : 0;
  const gapY =
    a.top + a.height <= b.top
      ? b.top - (a.top + a.height)
      : b.top + b.height <= a.top
        ? a.top - (b.top + b.height)
        : 0;

  if (gapX > 0 && gapY === 0) return gapX * FABRIC_TO_MM;
  if (gapY > 0 && gapX === 0) return gapY * FABRIC_TO_MM;
  if (gapX > 0 && gapY > 0) return Math.min(gapX, gapY) * FABRIC_TO_MM;
  return null;
}

const ADA_CLEARANCE_MM = 900;

export function runPlannerComplianceCheck(_editor: null, _shapes: unknown[]): string[] {
  const items = readFurnitureRects();
  const findings: string[] = [];
  let tightClearanceCount = 0;

  for (let index = 0; index < items.length; index += 1) {
    for (let inner = index + 1; inner < items.length; inner += 1) {
      if (overlaps(items[index], items[inner])) {
        findings.push(`CRITICAL: ${items[index].name} overlaps ${items[inner].name}`);
        continue;
      }

      const gapMm = rectGapMm(items[index], items[inner]);
      if (gapMm !== null && gapMm < ADA_CLEARANCE_MM) {
        tightClearanceCount += 1;
      }
    }
  }

  if (tightClearanceCount > 0) {
    findings.push(
      `COMPLIANCE WARNING: ${tightClearanceCount} module boundary clearances are under the strict ${ADA_CLEARANCE_MM}mm ADA minimum.`,
    );
  }

  return findings;
}
