/**
 * Legacy planner AI service path.
 *
 * Compatibility shim — re-exports the canonical implementation from
 * features/planner/lib/aiService. Do not add logic here; edit the canonical
 * file. This shim keeps existing oando-planner imports working while the
 * planner surfaces converge on features/planner/.
 */

export * from "@/features/planner/lib/aiService";
export type {
  StylePreset,
  AIFurniturePlacement,
  AISpaceWarning,
  AIResponse,
  AIAction,
  RoomContext,
} from "@/features/planner/lib/aiService";
