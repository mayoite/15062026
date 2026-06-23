import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";
import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";
import { millimetersToCanvasUnits } from "@/features/planner/lib/calibrationScale";
import {
  PLANNER_CANVAS_CONFIG,
  PLANNER_LAYOUT_ORIGIN_UNITS,
  PLANNER_MM_PER_CANVAS_UNIT,
  capRoomEstimateMm,
  clampLayoutOrigin,
} from "@/features/planner/lib/canvasBounds";
import type { PlannerProjectMetadata } from "@/features/planner/onboarding/projectSetup";
import { metadataToSpaceSuggestInput } from "@/features/planner/onboarding/projectSetup";
import {
  normalizeCatalogMm,
  plannerCanvasUnits,
} from "@/features/planner/catalog/catalogBlockBridge";

import { buildSpaceSuggestUserPrompt, SPACE_SUGGEST_SYSTEM_PROMPT } from "./prompts";
import type { SpaceSuggestInput, SuggestedLayoutJson } from "./types";
import { browserApiFetch } from "@/lib/api/browserApi";
import { classifyAIResponse, validateLayoutSchema } from "./aiStatus";
import type { AIProviderClassification } from "./aiStatus";

const AISLE_MM = 1200;
const BENCH_SEATS = 4;

export function estimateRoomMm(seatCount: number, floorAreaSqFt?: number) {
  const sqFt = floorAreaSqFt ?? Math.max(1200, seatCount * 50);
  const sqM = sqFt * 0.092903;
  const aspect = 1.3;
  const depthM = Math.sqrt(sqM / aspect);
  const widthM = depthM * aspect;
  return capRoomEstimateMm(
    Math.max(PLANNER_CANVAS_CONFIG.layout.estimateRoomMinWidthMm, Math.round(widthM * 1000)),
    Math.max(PLANNER_CANVAS_CONFIG.layout.estimateRoomMinDepthMm, Math.round(depthM * 1000)),
  );
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
  const origin = clampLayoutOrigin(PLANNER_LAYOUT_ORIGIN_UNITS, PLANNER_LAYOUT_ORIGIN_UNITS, roomW, roomH);

  return {
    version: 1,
    source: "grid-pack",
    summary: `Starter shell for ${metadata.projectName} sized from ${metadata.floorAreaSqFt} sq ft.`,
    room: {
      label: metadata.projectName || "Office shell",
      x: origin.x,
      y: origin.y,
      widthMm: roomMm.widthMm,
      depthMm: roomMm.depthMm,
    },
    walls: buildPerimeterWalls(origin.x, origin.y, roomW, roomH, PLANNER_MM_PER_CANVAS_UNIT),
    zones: [],
    furniture: [],
  };
}

/** Deterministic grid-packing layout for facilities admins. */
export function suggestLayoutGridPack(input: SpaceSuggestInput): SuggestedLayoutJson {
  const catalog = PLANNER_CATALOG_ITEMS;
  const mmPerUnit = PLANNER_MM_PER_CANVAS_UNIT;
  const roomMm = estimateRoomMm(input.seatCount, input.floorAreaSqFt);
  const roomW = plannerCanvasUnits(roomMm.widthMm);
  const roomH = plannerCanvasUnits(roomMm.depthMm);
  const origin = clampLayoutOrigin(PLANNER_LAYOUT_ORIGIN_UNITS, PLANNER_LAYOUT_ORIGIN_UNITS, roomW, roomH);
  const originX = origin.x;
  const originY = origin.y;
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
      const x = originX + 80 + col * (benchW + aisle * 0.35);
      const y = originY + 80 + row * (benchH + aisle);
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
      x: originX + 40,
      y: originY + 40,
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
      x: originX + roomW - plannerCanvasUnits(storage.widthMm) - 60,
      y: originY + roomH - plannerCanvasUnits(storage.heightMm) - 60,
    });
  }

  if (input.purpose === "meeting-rooms" || input.purpose === "mixed" || input.seatCount >= 30) {
    const meeting = pickMeetingRoom(catalog);
    if (meeting) {
      furniture.push({
        catalogItemId: meeting.id,
        label: meeting.name,
        x: originX + roomW - plannerCanvasUnits(meeting.widthMm) - 100,
        y: originY + 80,
      });
      zones.push({
        label: "Meeting area",
        x: originX + roomW - plannerCanvasUnits(meeting.widthMm) - 140,
        y: originY + 40,
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
      x: originX,
      y: originY,
      widthMm: roomMm.widthMm,
      depthMm: roomMm.depthMm,
    },
    walls: buildPerimeterWalls(originX, originY, roomW, roomH, mmPerUnit),
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
  status: AIProviderClassification;
  requestTimestamp: number;
};

/** Optional LLM pass — falls back to grid pack when provider or parse fails.
 * Pass an `AbortSignal` to cancel an in-flight request (e.g. from AIAssistDrawer).
 * P6-06: AbortController support added; previously had no cancellation path.
 * Lane 4: Enhanced with AI status classification and stale response rejection.
 */
export async function suggestLayout(
  input: SpaceSuggestInput,
  signal?: AbortSignal,
): Promise<SuggestLayoutResult> {
  const requestTimestamp = Date.now();
  let lastError: unknown;
  let provider = "unknown";

  try {
    const response = await browserApiFetch("/api/planner/ai-advisor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "space-suggest",
        messages: [
          { role: "system", content: SPACE_SUGGEST_SYSTEM_PROMPT },
          { role: "user", content: buildSpaceSuggestUserPrompt(input) },
        ],
        context: {
          seatCount: input.seatCount,
          purpose: input.purpose,
          floorAreaSqFt: input.floorAreaSqFt,
        },
      }),
      signal,
    });

    if (response.ok) {
      const data = (await response.json()) as {
        layout?: SuggestedLayoutJson;
        content?: string;
        provider?: string;
      };
      provider = typeof data.provider === "string" && data.provider.trim() ? data.provider.trim() : provider;
      if (data.layout && validateLayoutSchema(data.layout)) {
        return {
          layout: data.layout,
          usedFallback: false,
          status: classifyAIResponse(true, false, null, provider),
          requestTimestamp,
        };
      }
      if (typeof data.content === "string") {
        const parsed = parseSuggestedLayoutJson(data.content);
        if (parsed && validateLayoutSchema(parsed)) {
          return {
            layout: parsed,
            usedFallback: false,
            status: classifyAIResponse(true, false, null, provider),
            requestTimestamp,
          };
        }
      }
      lastError = new Error("Response parsed but failed schema validation");
    }
  } catch (err) {
    lastError = err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
  }

  const fallbackLayout = suggestLayoutGridPack(input);
  const fallbackStatus = classifyAIResponse(
    true,
    true,
    lastError,
    provider,
  );

  return {
    layout: fallbackLayout,
    usedFallback: true,
    status: fallbackStatus,
    requestTimestamp,
  };
}
