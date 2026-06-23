import OpenAI from "openai";

import { SketchToPlanResponseSchema } from "@/lib/api/schemas";
import { resolveProviderChain } from "@/lib/ai/providerChain";

export type SketchToPlanRequest = {
  imageDataUrl: string;
  fileName: string;
  prompt: string;
  includeRooms: boolean;
};

export type SketchToPlanResponse = {
  objects: Array<
    | { type: "wall"; x1: number; y1: number; x2: number; y2: number }
    | { type: "room"; left: number; top: number; width: number; height: number; label?: string }
  >;
  warnings: string[];
};

export const SKETCH_TO_PLAN_SYSTEM_PROMPT = [
  "You convert a hand sketch into a simple editable floor plan.",
  "Return only valid JSON with an objects array and warnings array.",
  "Prefer walls and rectangular rooms; do not return blueprint overlays.",
  "The output must be editable geometry, not a rendered image.",
].join(" ");

function buildUserContent(request: SketchToPlanRequest) {
  return [
    {
      type: "text" as const,
      text: [
        `Sketch file: ${request.fileName}`,
        `User prompt: ${request.prompt}`,
        `Include rooms: ${request.includeRooms ? "yes" : "no"}`,
        "Convert the sketch into editable walls and rooms.",
        "Use the simplest geometry that preserves the sketch intent.",
      ].join("\n"),
    },
    {
      type: "image_url" as const,
      image_url: { url: request.imageDataUrl },
    },
  ];
}

function createSketchClient() {
  const provider = resolveProviderChain()[0];
  if (!provider) {
    throw new Error("Missing AI provider credentials.");
  }
  return new OpenAI({
    apiKey: provider.apiKey,
    baseURL: provider.baseURL,
    defaultHeaders: provider.defaultHeaders,
  });
}

function parseSketchResponse(raw: string) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return SketchToPlanResponseSchema.parse(JSON.parse(raw.slice(start, end + 1)));
  } catch {
    return null;
  }
}

export function buildSketchPlanFabricDraft(response: SketchToPlanResponse): string {
  const objects = response.objects.map((object) => {
    if (object.type === "wall") {
      return {
        type: "line",
        version: "5.3.0",
        x1: object.x1,
        y1: object.y1,
        x2: object.x2,
        y2: object.y2,
        left: Math.min(object.x1, object.x2),
        top: Math.min(object.y1, object.y2),
        width: Math.abs(object.x2 - object.x1) || 1,
        height: Math.abs(object.y2 - object.y1) || 1,
        stroke: "#111827",
        strokeWidth: 2,
        selectable: true,
        evented: true,
        hasControls: false,
        hasBorders: false,
        originX: "left",
        originY: "top",
        name: `WALL:${crypto.randomUUID()}`,
      };
    }

    return {
      type: "rect",
      version: "5.3.0",
      left: object.left,
      top: object.top,
      width: object.width,
      height: object.height,
      fill: "rgba(148, 163, 184, 0.08)",
      stroke: "#334155",
      strokeWidth: 2,
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      originX: "left",
      originY: "top",
      name: `ROOM:${object.label ?? "Room"}`,
    };
  });

  return JSON.stringify({
    version: "5.3.0",
    objects,
    background: "#eceff1",
  });
}

export async function requestSketchToPlan(request: SketchToPlanRequest) {
  const provider = resolveProviderChain()[0];
  if (!provider) {
    throw new Error("Missing AI provider credentials.");
  }

  const client = createSketchClient();
  const completion = await client.chat.completions.create({
    model: provider.model,
    messages: [
      { role: "system", content: SKETCH_TO_PLAN_SYSTEM_PROMPT },
      { role: "user", content: buildUserContent(request) },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  const raw = Array.isArray(content) ? content.map((part) => (typeof part === "string" ? part : "")).join("") : String(content ?? "");
  const parsed = parseSketchResponse(raw);
  if (!parsed) {
    throw new Error("Sketch conversion response was not valid JSON.");
  }
  return parsed;
}
