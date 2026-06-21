/**
 * @deprecated Use `POST /api/planner/ai-advisor` instead.
 *
 * Legacy mock AI advisor endpoint. Returns a static, rule-based response
 * (no real AI provider). Kept as a thin shim for backwards compatibility —
 * the orphaned `useAiAdvisor` hook still targets this route, though it is
 * not mounted in any active UI. Prefer the canonical planner advisor.
 *
 * Auth: guest (anonymous allowed). Rate-limited per IP.
 *
 * Request body: {@link LegacyAdvisorRequestSchema} —
 *   `{ messages: [{role, content}], plannerType: "oando"|"buddy" }`.
 *
 * Response (200): `{ success: true, reply, suggestion? }`.
 * Errors: 400 (validation), 429 (rate limit), 500.
 */

import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { success, validationError } from "@/lib/api/apiResponse";
import { LegacyAdvisorRequestSchema } from "@/lib/api/schemas";

type AdvisorSuggestion = {
  type: "layout";
  preset: string;
  zones: string[];
};

async function handleLegacyAdvisor(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.json().catch(() => null);
  const parsed = LegacyAdvisorRequestSchema.safeParse(rawBody);
  if (!parsed.success) return validationError(parsed.error.issues);
  const { messages, plannerType } = parsed.data;

  const lastMessage = messages[messages.length - 1];
  const userQuery = lastMessage?.content || "";

  // Mock response logic (kept for backwards compat; no real AI call).
  const isLayoutQuery = /layout|arrange|place|position|floor plan/i.test(userQuery);

  let reply: string;
  let suggestion: AdvisorSuggestion | undefined;

  if (isLayoutQuery) {
    reply = `For your ${plannerType} workspace, I'd recommend an open-plan layout with clustered workstations and a dedicated collaboration zone. This maximizes space efficiency while maintaining ergonomic standards.`;
    suggestion = {
      type: "layout",
      preset: "open-plan-cluster",
      zones: ["workstations", "collaboration", "focus"],
    };
  } else {
    reply = `Based on your ${plannerType} project requirements, I suggest considering ergonomic seating options combined with height-adjustable desks. This configuration works well for teams of 4-12 people and supports both focused work and team interaction.`;
  }

  const response: { reply: string; suggestion?: AdvisorSuggestion } = { reply };
  if (suggestion) response.suggestion = suggestion;

  return success(response);
}

/** @deprecated Mock AI advisor. Prefer `POST /api/planner/ai-advisor`. */
export const POST = withAuth(
  async (req) => handleLegacyAdvisor(req as NextRequest),
  { role: "guest", rateLimitScope: "ai-advisor", rateLimit: 10 },
);
