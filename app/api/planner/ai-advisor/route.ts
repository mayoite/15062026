/**
 * POST /api/planner/ai-advisor — AI Layout Advisor (canonical planner route).
 *
 * Multi-turn chat endpoint using the provider chain. Accepts `messages` plus
 * optional planner `context` and returns an assistant response with an
 * optional structured `suggestion` for one-click apply. Also supports a
 * `space-suggest` mode that returns a parsed layout JSON object.
 *
 * Auth: guest (anonymous allowed). Rate-limited per IP via `withAuth`.
 *
 * Request body: {@link PlannerAdvisorRequestSchema} —
 *   `{ mode?: "chat"|"space-suggest", messages: [{role, content}], context? }`.
 *
 * Response (200):
 *   - chat mode: `{ success: true, content, suggestion? }`
 *   - space-suggest mode: `{ success: true, layout, content }`
 *
 * Errors: 400 (validation), 429 (rate limit), 503 (AI unavailable), 500.
 */

import type { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { AI_ADVISOR_PLANNER_ID } from "@/features/planner/ai/aiAdvisorConfig";
import { CHAT_ADVISOR_SYSTEM_PROMPT } from "@/features/planner/ai/prompts";
import { withAuth } from "@/lib/api/withAuth";
import { ApiError, API_ERROR_CODES } from "@/lib/api/ApiError";
import { success, error, validationError } from "@/lib/api/apiResponse";
import { PlannerAdvisorRequestSchema } from "@/lib/api/schemas";

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

/** Generate a helpful response when the AI provider is unavailable. */
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

/** Core advisor logic, invoked after auth + validation. */
async function handlePlannerAdvisor(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.json().catch(() => null);
  const parsed = PlannerAdvisorRequestSchema.safeParse(rawBody);
  if (!parsed.success) return validationError(parsed.error.issues);
  const { mode: rawMode, messages, context: rawContext } = parsed.data;
  const mode = rawMode === "space-suggest" ? "space-suggest" : "chat";
  const context = normalizeContext(rawContext);

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

  let aiResponse: string | undefined;
  let suggestion: { type: string; description: string; actionLabel: string } | undefined;
  let degraded = false;
  let usedProvider = "unknown";

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
        usedProvider = provider.provider || "unknown";
        aiResponse = await requestProviderText(provider, chatMessages, {
          temperature: mode === "space-suggest" ? 0.2 : 0.7,
          jsonMode: mode === "space-suggest",
        });
        lastError = undefined;
        break;
      } catch (providerError) {
        lastError = providerError;
        degraded = true;
      }
    }

    if (!aiResponse) {
      throw lastError ?? new Error("All AI providers failed");
    }

    if (mode === "space-suggest") {
      const layout = parseSuggestedLayoutJson(aiResponse);
      if (layout) {
        return success({
          layout,
          content: typeof layout.summary === "string" ? layout.summary : "Layout suggested.",
          provider: usedProvider,
          degraded: false,
        });
      }
      return error(
        new ApiError(
          503,
          API_ERROR_CODES.SERVICE_UNAVAILABLE,
          "Space suggest response was not valid layout JSON.",
        ),
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
        aiResponse = aiResponse.replace(/\[APPLY:.*?]/, "").trim();
      }
    }
  } catch (err) {
    if (mode === "space-suggest") {
      console.error("[planner/ai-advisor] space-suggest error:", err);
      return error(
        new ApiError(
          503,
          API_ERROR_CODES.SERVICE_UNAVAILABLE,
          "Space suggest unavailable — use client grid pack fallback.",
        ),
      );
    }
    console.error("[planner/ai-advisor] provider error:", err);
    const lastUserMsg = messages.filter((m) => m.role === "user").pop();
    aiResponse = generateFallbackResponse(lastUserMsg?.content || "");
    degraded = true;
  }

  return success({ content: aiResponse, suggestion, degraded, provider: usedProvider });
}

/** AI Layout Advisor. Guest auth; rate-limited. */
export const POST = withAuth(
  async (req) => handlePlannerAdvisor(req as NextRequest),
  { role: "guest", rateLimitScope: "planner-ai-advisor", rateLimit: 10 },
);
