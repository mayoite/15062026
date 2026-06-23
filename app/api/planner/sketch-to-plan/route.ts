/**
 * POST /api/planner/sketch-to-plan - Convert a sketch image into editable plan geometry.
 */

import type { NextRequest, NextResponse } from "next/server";

import { withAuth } from "@/lib/api/withAuth";
import { error, success, validationError } from "@/lib/api/apiResponse";
import { ApiError, API_ERROR_CODES } from "@/lib/api/ApiError";
import { SketchToPlanRequestSchema } from "@/lib/api/schemas";
import { requestSketchToPlan } from "@/features/planner/ai/sketchToPlan";

async function handleSketchToPlan(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.json().catch(() => null);
  const parsed = SketchToPlanRequestSchema.safeParse(rawBody);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const result = await requestSketchToPlan(parsed.data);
    return success(result);
  } catch (err) {
    return error(
      new ApiError(
        503,
        API_ERROR_CODES.SERVICE_UNAVAILABLE,
        err instanceof Error ? err.message : "Sketch conversion unavailable.",
      ),
    );
  }
}

export const POST = withAuth(
  async (req) => handleSketchToPlan(req as NextRequest),
  { role: "guest", rateLimitScope: "planner-sketch-to-plan", rateLimit: 8 },
);
