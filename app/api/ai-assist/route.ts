/**
 * @deprecated Use `POST /api/planner/ai-advisor` instead.
 *
 * Legacy generic chat-completion proxy. Forwards a `messages` array through the
 * provider chain and returns the first successful provider's text. No active UI
 * callers remain; kept as a thin shim for backwards compatibility. Prefer the
 * canonical planner advisor for new integrations.
 *
 * Auth: guest (anonymous allowed). Rate-limited per IP.
 *
 * Request body: {@link AiAssistRequestSchema} —
 *   `{ messages: [{role, content}] }`.
 *
 * Response (200): `{ success: true, content, provider, model }`.
 * Errors: 400 (validation), 429 (rate limit), 500 (no provider / all failed).
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { ApiError, API_ERROR_CODES } from "@/lib/api/ApiError";
import { success, error, validationError } from "@/lib/api/apiResponse";
import { AiAssistRequestSchema } from "@/lib/api/schemas";
import {
  requestProviderText,
  resolveProviderChain,
  type ServerChatMessage,
} from "@/lib/ai/providerChain";

async function handleAiAssist(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.json().catch(() => null);
  const parsed = AiAssistRequestSchema.safeParse(rawBody);
  if (!parsed.success) return validationError(parsed.error.issues);
  const { messages } = parsed.data;

  const providers = resolveProviderChain();
  if (providers.length === 0) {
    return error(
      new ApiError(
        500,
        API_ERROR_CODES.INTERNAL_ERROR,
        "Missing AI provider credentials. Configure GOOGLE_API_KEY, NOVA_ACT_API_KEY/AWS_BEARER_TOKEN_BEDROCK, or OPENROUTER_API_KEY.",
      ),
    );
  }

  let lastError: unknown = null;
  for (const provider of providers) {
    try {
      const content = await requestProviderText(
        provider,
        messages as ServerChatMessage[],
        { jsonMode: true },
      );
      return success({ content, provider: provider.provider, model: provider.model });
    } catch (providerError) {
      lastError = providerError;
      console.error(`[ai-assist] ${provider.provider} error:`, providerError);
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : "Failed to call AI service";
  return error(new ApiError(500, API_ERROR_CODES.INTERNAL_ERROR, message));
}

/** @deprecated Generic chat proxy. Prefer `POST /api/planner/ai-advisor`. */
export const POST = withAuth(
  async (req) => handleAiAssist(req as NextRequest),
  { role: "guest", rateLimitScope: "ai-assist", rateLimit: 15 },
);
