/**
 * /api/planner/ai-advisor - AI Layout Advisor API route
 *
 * Multi-turn chat endpoint using the provider chain.
 * Accepts messages + planner context, returns assistant response
 * with optional structured suggestion for one-click apply.
 */

import { type NextRequest, NextResponse } from "next/server";
import { AI_ADVISOR_PLANNER_ID } from "@/features/planner/ai/aiAdvisorConfig";
import { CHAT_ADVISOR_SYSTEM_PROMPT } from "@/features/planner/ai/prompts";
import { rateLimit } from "@/lib/rateLimit";

interface AiAdvisorRequest {
  mode?: "chat" | "space-suggest";
  messages: Array<{ role: string; content: string }>;
  seatCount?: number;
  purpose?: string;
  floorAreaSqFt?: number;
  context?: {
    planner?: "oando" | "buddy" | "unified";
    roomWidth?: number;
    roomHeight?: number;
    currentShapeCount?: number;
    seatCount?: number;
    purpose?: string;
    floorAreaSqFt?: number;
    projectName?: string;
  };
}

type NormalizedMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type NormalizedContext = {
  planner?: "oando" | "buddy" | "unified";
  roomWidth?: number;
  roomHeight?: number;
  currentShapeCount?: number;
  seatCount?: number;
  purpose?: string;
  floorAreaSqFt?: number;
  projectName?: string;
};

function normalizeMessages(value: unknown): NormalizedMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as Record<string, unknown>;
      const role = candidate.role;
      const content = typeof candidate.content === "string" ? candidate.content.trim().slice(0, 2000) : "";
      if (!content) return null;
      if (role !== "system" && role !== "user" && role !== "assistant") return null;
      return { role, content } as NormalizedMessage;
    })
    .filter((item): item is NormalizedMessage => item !== null)
    .slice(0, 20);
}

function normalizeContext(value: unknown): NormalizedContext | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const source = value as Record<string, unknown>;
  const context: NormalizedContext = {};

  if (source.planner === "oando" || source.planner === "buddy" || source.planner === "unified") {
    context.planner = source.planner;
  }
  if (typeof source.roomWidth === "number" && Number.isFinite(source.roomWidth)) {
    context.roomWidth = source.roomWidth;
  }
  if (typeof source.roomHeight === "number" && Number.isFinite(source.roomHeight)) {
    context.roomHeight = source.roomHeight;
  }
  if (typeof source.currentShapeCount === "number" && Number.isFinite(source.currentShapeCount)) {
    context.currentShapeCount = source.currentShapeCount;
  }
  if (typeof source.seatCount === "number" && Number.isFinite(source.seatCount)) {
    context.seatCount = Math.round(source.seatCount);
  }
  if (typeof source.purpose === "string" && source.purpose.trim()) {
    context.purpose = source.purpose.trim().slice(0, 64);
  }
  if (typeof source.floorAreaSqFt === "number" && Number.isFinite(source.floorAreaSqFt)) {
    context.floorAreaSqFt = Math.round(source.floorAreaSqFt);
  }
  if (typeof source.projectName === "string" && source.projectName.trim()) {
    context.projectName = source.projectName.trim().slice(0, 120);
  }

  return context;
}

function formatChatContextBlock(context: NormalizedContext | undefined): string {
  if (!context) return "";
  const lines: string[] = [];
  const planner = context.planner ?? AI_ADVISOR_PLANNER_ID;
  lines.push(`Planner: ${planner}.`);
  if (context.projectName) lines.push(`Project: ${context.projectName}.`);
  if (context.seatCount) lines.push(`Seat target: ${context.seatCount}.`);
  if (context.purpose) lines.push(`Primary purpose: ${context.purpose}.`);
  if (context.floorAreaSqFt) lines.push(`Floor area: ${context.floorAreaSqFt} sq ft.`);
  if (context.roomWidth && context.roomHeight) {
    lines.push(`Room: ${context.roomWidth}×${context.roomHeight} mm.`);
  }
  if (context.currentShapeCount !== undefined) {
    lines.push(`Canvas furniture placements: ${context.currentShapeCount}.`);
  }
  return lines.length ? `\n\nContext:\n${lines.join("\n")}` : "";
}

function parseSuggestedLayoutJson(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd <= jsonStart) return null;
  try {
    const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as Record<string, unknown>;
    if (parsed.version !== 1 || !Array.isArray(parsed.furniture)) return null;
    return { ...parsed, source: "llm" };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      "127.0.0.1";
    const limitRes = await rateLimit(`planner-ai-advisor:${ip}`, 10, 60 * 1000);
    if (!limitRes.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "X-RateLimit-Reset": limitRes.reset.toString() } },
      );
    }

    const body = (await request.json().catch(() => null)) as Partial<AiAdvisorRequest> | null;
    const mode = body?.mode === "space-suggest" ? "space-suggest" : "chat";
    const messages = normalizeMessages(body?.messages);
    const context = normalizeContext(body?.context);

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 },
      );
    }

    const fullMessages =
      mode === "space-suggest"
        ? messages
        : [
            {
              role: "system" as const,
              content: `${CHAT_ADVISOR_SYSTEM_PROMPT}${formatChatContextBlock(context)}`,
            },
            ...messages,
          ];

    // Try provider chain: primary AI provider
    let aiResponse: string | undefined;
    let suggestion: { type: string; description: string; actionLabel: string } | undefined;

    try {
      const { resolveProviderChain, requestProviderText } = await import(
        "@/lib/ai/providerChain"
      );
      const providers = resolveProviderChain();
      if (providers.length === 0) {
        throw new Error("No AI provider configured");
      }

      const chatMessages = fullMessages.map((m) => ({
        role: m.role as "system" | "user" | "assistant",
        content: m.content,
      }));

      let lastError: unknown;
      for (const provider of providers) {
        try {
          aiResponse = await requestProviderText(provider, chatMessages, {
            temperature: mode === "space-suggest" ? 0.2 : 0.7,
          });
          lastError = undefined;
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (!aiResponse) {
        throw lastError ?? new Error("All AI providers failed");
      }

      if (mode === "space-suggest") {
        const layout = parseSuggestedLayoutJson(aiResponse);
        if (layout) {
          return NextResponse.json({
            layout,
            content: typeof layout.summary === "string" ? layout.summary : "Layout suggested.",
          });
        }
        return NextResponse.json(
          { error: "Space suggest response was not valid layout JSON." },
          { status: 503 },
        );
      }

      if (aiResponse.includes("[APPLY:")) {
        const match = aiResponse.match(/\[APPLY:\s*(.+?)\]/);
        if (match) {
          suggestion = {
            type: "placement",
            description: match[1],
            actionLabel: `Apply: ${match[1].slice(0, 30)}...`,
          };
          aiResponse = aiResponse.replace(/\[APPLY:.*?\]/, "").trim();
        }
      }
    } catch {
      if (mode === "space-suggest") {
        return NextResponse.json(
          { error: "Space suggest unavailable — use client grid pack fallback." },
          { status: 503 },
        );
      }
      // Fallback: return a helpful static response when AI is unavailable
      const lastUserMsg = messages.filter((m) => m.role === "user").pop();
      aiResponse = generateFallbackResponse(lastUserMsg?.content || "");
    }

    return NextResponse.json({
      content: aiResponse,
      suggestion,
    });
  } catch (error) {
    console.error("[ai-advisor] Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}

/**
 * Generate a helpful response when the AI provider is unavailable.
 */
function generateFallbackResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes("desk") && lower.match(/\d+/)) {
    const count = lower.match(/\d+/)?.[0] || "6";
    return `I'd recommend placing ${count} desks in a back-to-back bench configuration for efficient space use. Use the "4-Seat Bench" or "6-Seat Bench" from the catalog and arrange them in rows with 1200mm spacing between facing rows. This maintains ergonomic clearance while maximizing seat density.`;
  }

  if (lower.includes("team") && lower.match(/\d+/)) {
    const size = lower.match(/\d+/)?.[0] || "12";
    return `For a team of ${size}, I'd suggest the "Mixed Workspace" template — it provides a balance of focused work areas and collaboration zones. You can apply it from the Templates button in the toolbar, then customize team assignments in the inspector panel.`;
  }

  if (lower.includes("meeting") || lower.includes("conference")) {
    return `For meeting spaces, consider a mix of sizes: 1-2 phone booths for quick calls, a 4-person meeting room for daily standups, and a larger 8-12 person conference room for team meetings. Place them along the perimeter to minimize noise disruption to the open workspace.`;
  }

  return `I can help you plan your workspace! Try asking things like:\n• "Place 6 workstations near the window"\n• "Team of 20, collaborative style"\n• "Add meeting rooms for 50 people"\n\nYou can also use the Templates button to start with a pre-built layout.`;
}
