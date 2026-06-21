import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";
import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";
import { millimetersToCanvasUnits } from "@/features/planner/lib/calibrationScale";
import type { PlannerProjectMetadata } from "@/features/planner/onboarding/projectSetup";
import { metadataToSpaceSuggestInput } from "@/features/planner/onboarding/projectSetup";
import {
  normalizeCatalogMm,
  plannerCanvasUnits,
} from "@/features/planner/catalog/catalogBlockBridge";

import { buildSpaceSuggestUserPrompt, SPACE_SUGGEST_SYSTEM_PROMPT } from "./prompts";
import type { SpaceSuggestInput, SuggestedLayoutJson } from "./types";

const ORIGIN_X = 120;
const ORIGIN_Y = 120;
const AISLE_MM = 1200;
const BENCH_SEATS = 4;

function estimateRoomMm(seatCount: number, floorAreaSqFt?: number) {
  const sqFt = floorAreaSqFt ?? Math.max(1200, seatCount * 50);
  const sqM = sqFt * 0.092903;
  const aspect = 1.3;
  const depthM = Math.sqrt(sqM / aspect);
  const widthM = depthM * aspect;
  return {
    widthMm: Math.max(6000, Math.round(widthM * 1000)),
    depthMm: Math.max(5000, Math.round(depthM * 1000)),
  };
}

function pickWorkstationBench(catalog: CatalogItem[], seatsNeeded: number): CatalogItem {
  const benches = catalog.filter(
    (item) =>
      item.category === "desks" &&
      (item.shapeType === "planner-bench" || item.tags.some((tag) => tag.includes("seater"))),
  );
  const exact = benches.find((item) => item.seatCount === Math.min(BENCH_SEATS, seatsNeeded));
  if (exact) return exact;
  const fallback = benches.find((item) => (item.seatCount ?? 1) >= 2);
  return fallback ?? catalog.find((item) => item.category === "desks") ?? catalog[0];
}

function pickStorageUnit(catalog: CatalogItem[]): CatalogItem | null {
  return catalog.find((item) => item.category === "storage") ?? null;
}

function pickMeetingRoom(catalog: CatalogItem[]): CatalogItem | null {
  return (
    catalog.find((item) => item.id === "room-meeting-8") ??
    catalog.find((item) => item.category === "rooms" && item.tags.includes("meeting")) ??
    null
  );
}

function buildPerimeterWalls(
  x: number,
  y: number,
  widthCu: number,
  heightCu: number,
  mmPerUnit: number,
): SuggestedLayoutJson["walls"] {
  const toMm = (units: number) => Math.round(units * mmPerUnit);
  return [
    { type: "planner-wall", x, y, endX: widthCu, endY: 0, lengthMm: toMm(widthCu) },
    {
      type: "planner-wall",
      x: x + widthCu,
      y,
      endX: 0,
      endY: heightCu,
      lengthMm: toMm(heightCu),
    },
    {
      type: "planner-wall",
      x: x + widthCu,
      y: y + heightCu,
      endX: -widthCu,
      endY: 0,
      lengthMm: toMm(widthCu),
    },
    { type: "planner-wall", x, y: y + heightCu, endX: 0, endY: -heightCu, lengthMm: toMm(heightCu) },
  ];
}

export function buildShellOnlyLayout(metadata: PlannerProjectMetadata): SuggestedLayoutJson {
  const input = metadataToSpaceSuggestInput(metadata);
  const roomMm = estimateRoomMm(input.seatCount, input.floorAreaSqFt);
  const roomW = plannerCanvasUnits(roomMm.widthMm);
  const roomH = plannerCanvasUnits(roomMm.depthMm);

  return {
    version: 1,
    source: "grid-pack",
    summary: `Starter shell for ${metadata.projectName} sized from ${metadata.floorAreaSqFt} sq ft.`,
    room: {
      label: metadata.projectName || "Office shell",
      x: ORIGIN_X,
      y: ORIGIN_Y,
      widthMm: roomMm.widthMm,
      depthMm: roomMm.depthMm,
    },
    walls: buildPerimeterWalls(ORIGIN_X, ORIGIN_Y, roomW, roomH, 10),
    zones: [],
    furniture: [],
  };
}

/** Deterministic grid-packing layout for facilities admins. */
export function suggestLayoutGridPack(input: SpaceSuggestInput): SuggestedLayoutJson {
  const catalog = PLANNER_CATALOG_ITEMS;
  const mmPerUnit = 10;
  const roomMm = estimateRoomMm(input.seatCount, input.floorAreaSqFt);
  const roomW = plannerCanvasUnits(roomMm.widthMm);
  const roomH = plannerCanvasUnits(roomMm.depthMm);
  const aisle = millimetersToCanvasUnits(AISLE_MM);

  const bench = pickWorkstationBench(catalog, input.seatCount);
  const benchW = plannerCanvasUnits(bench.widthMm);
  const benchH = plannerCanvasUnits(bench.heightMm);
  const seatsPerBench = Math.max(1, bench.seatCount ?? BENCH_SEATS);
  const benchesNeeded = Math.ceil(input.seatCount / seatsPerBench);
  const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(benchesNeeded))));
  const rows = Math.ceil(benchesNeeded / cols);

  const furniture: SuggestedLayoutJson["furniture"] = [];
  let placedSeats = 0;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (placedSeats >= input.seatCount) break;
      if (placedSeats > 0 && placedSeats + seatsPerBench > input.seatCount) break;
      const x = ORIGIN_X + 80 + col * (benchW + aisle * 0.35);
      const y = ORIGIN_Y + 80 + row * (benchH + aisle);
      furniture.push({
        catalogItemId: bench.id,
        label: bench.name,
        x,
        y,
      });
      placedSeats += seatsPerBench;
    }
    if (placedSeats >= input.seatCount) break;
  }

  const zones: SuggestedLayoutJson["zones"] = [
    {
      label: "Open workstations",
      x: ORIGIN_X + 40,
      y: ORIGIN_Y + 40,
      widthMm: roomMm.widthMm - 800,
      heightMm: roomMm.depthMm - 1600,
      zoneType: "focus",
    },
  ];

  const storage = pickStorageUnit(catalog);
  if (storage) {
    furniture.push({
      catalogItemId: storage.id,
      label: storage.name,
      x: ORIGIN_X + roomW - plannerCanvasUnits(storage.widthMm) - 60,
      y: ORIGIN_Y + roomH - plannerCanvasUnits(storage.heightMm) - 60,
    });
  }

  if (input.purpose === "meeting-rooms" || input.purpose === "mixed" || input.seatCount >= 30) {
    const meeting = pickMeetingRoom(catalog);
    if (meeting) {
      furniture.push({
        catalogItemId: meeting.id,
        label: meeting.name,
        x: ORIGIN_X + roomW - plannerCanvasUnits(meeting.widthMm) - 100,
        y: ORIGIN_Y + 80,
      });
      zones.push({
        label: "Meeting area",
        x: ORIGIN_X + roomW - plannerCanvasUnits(meeting.widthMm) - 140,
        y: ORIGIN_Y + 40,
        widthMm: normalizeCatalogMm(meeting.widthMm) + 200,
        heightMm: normalizeCatalogMm(meeting.heightMm) + 200,
        zoneType: "collaborative",
      });
    }
  }

  return {
    version: 1,
    source: "grid-pack",
    summary: `Packed ${Math.min(placedSeats, input.seatCount)} of ${input.seatCount} seats into ${rows} row(s) of ${seatsPerBench}-seat benches with aisles and storage.`,
    room: {
      label: "Support office shell",
      x: ORIGIN_X,
      y: ORIGIN_Y,
      widthMm: roomMm.widthMm,
      depthMm: roomMm.depthMm,
    },
    walls: buildPerimeterWalls(ORIGIN_X, ORIGIN_Y, roomW, roomH, mmPerUnit),
    zones,
    furniture,
  };
}

/**
 * Hardened JSON parser for LLM space-suggest responses (PR1 AI stabilize).
 * - Explicit field guards + version check (no blind casts or dupe parsers from review).
 * - Minimal regex extract + strict validate; falls back cleanly (no broad catch hiding validation).
 * - Delta from 0504: uses current SuggestedLayoutJson contract + safe source tagging.
 * - Always produces valid structure or null; outer suggest falls back to grid-pack.
 */
function parseSuggestedLayoutJson(raw: string): SuggestedLayoutJson | null {
  const trimmed = raw.trim();
  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd <= jsonStart) return null;

  let candidate: unknown;
  try {
    candidate = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1));
  } catch {
    return null; // only JSON syntax errors here; validation below is strict
  }

  if (candidate === null || candidate === undefined || typeof candidate !== "object") return null;
  const obj = candidate as Record<string, unknown>;
  if (obj.version !== 1 || !Array.isArray(obj.furniture)) return null;
  if (obj.room === null || obj.room === undefined || typeof obj.room !== "object") return null;

  return { ...(obj as SuggestedLayoutJson), source: "llm" };
}

export type SuggestLayoutResult = {
  layout: SuggestedLayoutJson;
  usedFallback: boolean;
};

/** Optional LLM pass — falls back to grid pack when provider or parse fails.
 * Pass an `AbortSignal` to cancel an in-flight request (e.g. from AIAssistDrawer).
 * P6-06: AbortController support added; previously had no cancellation path.
 */
export async function suggestLayout(
  input: SpaceSuggestInput,
  signal?: AbortSignal,
): Promise<SuggestLayoutResult> {
  try {
    const response = await fetch("/api/planner/ai-advisor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "space-suggest",
        seatCount: input.seatCount,
        purpose: input.purpose,
        floorAreaSqFt: input.floorAreaSqFt,
        messages: [
          { role: "system", content: SPACE_SUGGEST_SYSTEM_PROMPT },
          { role: "user", content: buildSpaceSuggestUserPrompt(input) },
        ],
      }),
      signal,
    });

    if (response.ok) {
      const data = (await response.json()) as { layout?: SuggestedLayoutJson; content?: string };
      if (data.layout) return { layout: data.layout, usedFallback: false };
      if (typeof data.content === "string") {
        const parsed = parseSuggestedLayoutJson(data.content);
        if (parsed) return { layout: parsed, usedFallback: false };
      }
    }
  } catch (err) {
    // AbortError is intentional — propagate it so callers can distinguish cancel from failure.
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    /* fall through to grid pack for any other network / parse error */
  }

  return { layout: suggestLayoutGridPack(input), usedFallback: true };
}
