/**
 * AI Service for the unified planner assistant.
 *
 * Canonical implementation. The advisor talks to /api/planner/ai-advisor,
 * which resolves a provider chain (no hardcoded vendor). Returns structured
 * placements, actions, and warnings for one-click apply in the editor.
 */

import type { CatalogItem } from "@/features/planner/store/catalogData";
import { furnitureCatalog } from "@/features/planner/store/catalogData";
import type { Room, FurnitureItem } from "@/features/planner/store/plannerStore";

export type StylePreset = "Modern" | "Traditional" | "Minimalist";

export interface AIFurniturePlacement {
  catalogId: string;
  name: string;
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
  color: string;
  shape: string;
}

export interface AISpaceWarning {
  type: "narrow-walkway" | "blocked-door" | "ergonomic" | "overcrowded" | "general";
  message: string;
  severity: "warning" | "error";
}

export interface AIResponse {
  message: string;
  placements?: AIFurniturePlacement[];
  warnings?: AISpaceWarning[];
  actions?: AIAction[];
}

export interface AIAction {
  type: "add" | "move" | "remove";
  catalogId?: string;
  furnitureId?: string;
  name?: string;
  x?: number;
  y?: number;
  rotation?: number;
}

export interface RoomContext {
  rooms: Room[];
  furniture: FurnitureItem[];
  selectedRoomId?: string | null;
}

function getCatalogSummary(): string {
  const byCategory: Record<string, CatalogItem[]> = {};
  for (const item of furnitureCatalog) {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  }
  return Object.entries(byCategory)
    .map(([cat, items]) =>
      `${cat}: ${items.map((i) => `${i.name} (id:${i.id}, ${Math.round(i.widthMm / 10)}x${Math.round(i.depthMm / 10)}cm)`).join(", ")}`
    )
    .join("\n");
}

function getRoomBounds(room: Room): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number; cx: number; cy: number } {
  const xs = room.points.map((p) => p.x);
  const ys = room.points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    minX, minY, maxX, maxY,
    width: maxX - minX,
    height: maxY - minY,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
  };
}

function buildSystemPrompt(style: StylePreset): string {
  return `You are an expert interior designer AI assistant for a 2D floor planner app. 
The canvas uses pixel coordinates where 1px = 1cm approximately.
Style preference: ${style}.

You MUST always respond with valid JSON only. No markdown, no explanations outside JSON.

Available furniture catalog:
${getCatalogSummary()}

For "auto-furnish" or layout requests, return JSON like:
{
  "message": "Here's a suggested layout...",
  "placements": [
    { "catalogId": "ws-linear-140", "name": "Linear Desk 1400", "x": 300, "y": 200, "rotation": 0, "width": 140, "height": 70, "color": "var(--border-soft)", "shape": "workstation-linear" }
  ],
  "warnings": []
}

For natural language commands (add/move/remove), return JSON like:
{
  "message": "I'll add a desk near the window...",
  "actions": [
    { "type": "add", "catalogId": "ws-linear-140", "name": "Linear Desk 1400", "x": 350, "y": 150, "rotation": 0 }
  ],
  "warnings": []
}

For space analysis, return JSON like:
{
  "message": "Here's my analysis...",
  "warnings": [
    { "type": "narrow-walkway", "message": "The walkway between the workstation and filing cabinet is only 40cm — minimum 60cm recommended.", "severity": "warning" }
  ]
}

For general questions, return JSON like:
{
  "message": "Your answer here..."
}

Rules:
- Only use catalogIds from the provided catalog
- Place furniture within room bounds, not overlapping walls
- Consider the style preset when choosing furniture
- For ${style} style: ${style === "Modern" ? "clean lines, minimal clutter, neutral colors" : style === "Traditional" ? "classic pieces, warm woods, layered textiles" : "bare essentials only, maximum open space"}
- Coordinates should be reasonable pixel values fitting within the room dimensions`;
}

export async function callAI(
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  roomContext: RoomContext,
  style: StylePreset,
  signal?: AbortSignal
): Promise<AIResponse> {
  const systemPrompt = buildSystemPrompt(style);

  const contextNote = buildContextNote(roomContext);

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...conversationHistory.slice(-8),
    {
      role: "user" as const,
      content: `${contextNote}\n\nUser request: ${userMessage}`,
    },
  ];

  const response = await fetch("/api/planner/ai-advisor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const content = data.content;

  try {
    const parsed = JSON.parse(content);
    return {
      message: parsed.message || "Done.",
      placements: parsed.placements,
      warnings: parsed.warnings,
      actions: parsed.actions,
    };
  } catch {
    return { message: content };
  }
}

export async function autoFurnishRoom(
  room: Room,
  existingFurniture: FurnitureItem[],
  style: StylePreset,
  signal?: AbortSignal
): Promise<AIResponse> {
  const bounds = getRoomBounds(room);
  const systemPrompt = buildSystemPrompt(style);

  const existingList = existingFurniture
    .map((f) => `${f.name} at (${Math.round(f.x)},${Math.round(f.y)})`)
    .join(", ");

  const messages = [
    { role: "system" as const, content: systemPrompt },
    {
      role: "user" as const,
      content: `Auto-furnish this room: "${room.name}"
Room bounds: x=${Math.round(bounds.minX)} to x=${Math.round(bounds.maxX)}, y=${Math.round(bounds.minY)} to y=${Math.round(bounds.maxY)}
Room dimensions: ${Math.round(bounds.width)}cm wide x ${Math.round(bounds.height)}cm tall
Room center: (${Math.round(bounds.cx)}, ${Math.round(bounds.cy)})
${existingList ? `Existing furniture: ${existingList}` : "No existing furniture."}

Suggest a complete, practical furniture layout for this room type. 
Place all furniture WITHIN the room bounds (between minX+margin and maxX-margin, minY+margin and maxY-margin).
Leave at least 60cm walkways between furniture.
Return a "placements" array with specific x,y coordinates within the room bounds.`,
    },
  ];

  const response = await fetch("/api/planner/ai-advisor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const content = data.content;

  try {
    const parsed = JSON.parse(content);
    return {
      message: parsed.message || "Here's a suggested layout.",
      placements: parsed.placements,
      warnings: parsed.warnings,
    };
  } catch {
    return { message: content };
  }
}

export async function analyzeSpace(
  roomContext: RoomContext,
  style: StylePreset,
  signal?: AbortSignal
): Promise<AIResponse> {
  const systemPrompt = buildSystemPrompt(style);
  const contextNote = buildContextNote(roomContext);

  const messages = [
    { role: "system" as const, content: systemPrompt },
    {
      role: "user" as const,
      content: `${contextNote}\n\nPlease analyze this floor plan for ergonomic issues, blocked pathways, crowding, or design problems. Return "warnings" with specific actionable feedback.`,
    },
  ];

  const response = await fetch("/api/planner/ai-advisor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const content = data.content;

  try {
    const parsed = JSON.parse(content);
    return {
      message: parsed.message || "Analysis complete.",
      warnings: parsed.warnings,
    };
  } catch {
    return { message: content };
  }
}

function buildContextNote(roomContext: RoomContext): string {
  const { rooms, furniture, selectedRoomId } = roomContext;
  const roomList = rooms
    .map((r) => {
      const b = getRoomBounds(r);
      return `- ${r.name} (id:${r.id}): ${Math.round(b.width)}x${Math.round(b.height)}cm at (${Math.round(b.minX)},${Math.round(b.minY)})${r.id === selectedRoomId ? " [SELECTED]" : ""}`;
    })
    .join("\n");
  const furnitureList = furniture
    .map((f) => `- ${f.name} (id:${f.id}, catalogId:${f.catalogId}): at (${Math.round(f.x)},${Math.round(f.y)}), ${f.width}x${f.height}cm, rot:${f.rotation}°`)
    .join("\n");

  return `Current floor plan context:
Rooms:
${roomList || "No rooms yet."}
Furniture:
${furnitureList || "No furniture yet."}`;
}
