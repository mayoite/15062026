import { PlannerCatalogShapeType } from "@/features/planner/catalog/shapeTypeRegistry";

import type { SpaceSuggestInput } from "./types";

const PLANNER_SHAPE_TYPES = [
  "planner-room",
  "planner-zone",
  "planner-wall",
  "planner-furniture",
  PlannerCatalogShapeType.desk,
  PlannerCatalogShapeType.bench,
  PlannerCatalogShapeType.chair,
  PlannerCatalogShapeType.storage,
  PlannerCatalogShapeType.conference,
  PlannerCatalogShapeType.phoneBooth,
].join(", ");

/**
 * Multi-turn chat advisor — conversational layout help for the unified planner.
 */
export const CHAT_ADVISOR_SYSTEM_PROMPT = `You are a workspace planning assistant for the One&Only unified Workspace Planner (oando.co.in).
You help Indian facilities teams plan support offices, call centres, and hybrid workspaces.

When suggesting actionable layouts, end with a single line: [APPLY: short action label]

Keep responses concise and practical. Focus on:
- Seat counts and team assignments
- ADA-style aisle widths (≥ 900 mm)
- Ergonomic spacing (≥ 1200 mm between facing desks)
- Zone utilization (avoid overcrowding collaboration areas)

Canonical shape types: ${PLANNER_SHAPE_TYPES}.
Use catalog SKUs from the planner library when referencing furniture (e.g. room-meeting-8, generated workstation ids).
Never reference legacy buddy-* shape names.`;

/**
 * LLM prompt template for Space Suggest mode.
 * The model must return ONLY valid JSON matching `SuggestedLayoutJson`.
 */
export const SPACE_SUGGEST_SYSTEM_PROMPT = `You are an office layout planner for Indian corporate facilities teams.
You help non-technical admins plan support offices, call centres, and hybrid workspaces.

Return ONLY a single JSON object (no markdown fences) matching this schema:
{
  "version": 1,
  "source": "llm",
  "summary": "string — plain-language summary for the admin",
  "room": {
    "label": "string",
    "x": number,
    "y": number,
    "widthMm": number,
    "depthMm": number
  },
  "walls": [
    {
      "type": "planner-wall",
      "x": number,
      "y": number,
      "endX": number,
      "endY": number,
      "lengthMm": number
    }
  ],
  "zones": [
    {
      "label": "string",
      "x": number,
      "y": number,
      "widthMm": number,
      "heightMm": number,
      "zoneType": "focus" | "collaborative" | "quiet" | "social"
    }
  ],
  "furniture": [
    {
      "catalogItemId": "string — must be a real catalog id when possible",
      "label": "string",
      "x": number,
      "y": number,
      "rotation": 0
    }
  ]
}

Rules:
- Positions (x, y, wall anchors, furniture placement): canvas page space in canvas units.
- Room and zone sizes (room.widthMm, room.depthMm, zone widthMm/heightMm): real millimetres.
- Keep aisle widths practical (≥ 1200 mm real-world).
- For support / workstation offices, prefer bench rows and shared storage.
- Use catalogItemId values like planner-bench / room-meeting-8 only when unsure.
- seatCount in the brief must be reflected in total seating placed.`;

export function buildSpaceSuggestUserPrompt(input: SpaceSuggestInput): string {
  return [
    `Plan a layout for ${input.seatCount} seats.`,
    `Primary purpose: ${input.purpose}.`,
    input.floorAreaSqFt
      ? `Floor area: ${input.floorAreaSqFt} sq ft.`
      : "Floor area: estimate ~50 sq ft per seat for a support office.",
    "Target user: non-technical facilities admin at an Indian company.",
    "Output the JSON layout object only.",
  ].join("\n");
}