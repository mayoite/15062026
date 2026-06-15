import type { AIAction } from "./aiService";

type RejectionReason =
  | "missing-catalog-id"
  | "unknown-catalog-id"
  | "missing-furniture-id"
  | "unknown-furniture-id"
  | "invalid-coordinate"
  | "invalid-rotation"
  | "unknown-action-type";

interface ValidationOptions {
  validCatalogIds: ReadonlySet<string>;
  validFurnitureIds: ReadonlySet<string>;
}

export interface RejectedAIAction {
  action: AIAction;
  reason: RejectionReason;
}

export interface ValidationResult {
  validActions: AIAction[];
  rejectedActions: RejectedAIAction[];
}

function isFiniteCoordinate(value: number | undefined): boolean {
  return value === undefined || Number.isFinite(value);
}

function isValidActionType(value: AIAction["type"] | string): value is AIAction["type"] {
  return value === "add" || value === "move" || value === "remove";
}

export function validateAIActions(
  actions: AIAction[] | undefined,
  options: ValidationOptions
): ValidationResult {
  if (!Array.isArray(actions)) {
    return { validActions: [], rejectedActions: [] };
  }

  const validActions: AIAction[] = [];
  const rejectedActions: RejectedAIAction[] = [];

  for (const action of actions) {
    if (!isValidActionType(action.type)) {
      rejectedActions.push({ action, reason: "unknown-action-type" });
      continue;
    }

    if (!isFiniteCoordinate(action.x) || !isFiniteCoordinate(action.y)) {
      rejectedActions.push({ action, reason: "invalid-coordinate" });
      continue;
    }

    if (action.rotation !== undefined && !Number.isFinite(action.rotation)) {
      rejectedActions.push({ action, reason: "invalid-rotation" });
      continue;
    }

    if (action.type === "add") {
      if (!action.catalogId) {
        rejectedActions.push({ action, reason: "missing-catalog-id" });
        continue;
      }
      if (!options.validCatalogIds.has(action.catalogId)) {
        rejectedActions.push({ action, reason: "unknown-catalog-id" });
        continue;
      }
      validActions.push(action);
      continue;
    }

    if (!action.furnitureId) {
      rejectedActions.push({ action, reason: "missing-furniture-id" });
      continue;
    }

    if (!options.validFurnitureIds.has(action.furnitureId)) {
      rejectedActions.push({ action, reason: "unknown-furniture-id" });
      continue;
    }

    validActions.push(action);
  }

  return { validActions, rejectedActions };
}

const REJECTION_LABELS: Record<RejectionReason, string> = {
  "missing-catalog-id": "missing catalog reference",
  "unknown-catalog-id": "unknown catalog item",
  "missing-furniture-id": "missing furniture reference",
  "unknown-furniture-id": "unknown furniture target",
  "invalid-coordinate": "invalid coordinate",
  "invalid-rotation": "invalid rotation",
  "unknown-action-type": "unknown action type",
};

export function summarizeRejectedAIActions(rejectedActions: RejectedAIAction[]): string | null {
  if (rejectedActions.length === 0) {
    return null;
  }

  const counts = new Map<RejectedAIAction["reason"], number>();
  for (const rejected of rejectedActions) {
    counts.set(rejected.reason, (counts.get(rejected.reason) ?? 0) + 1);
  }

  const details = [...counts.entries()]
    .map(([reason, count]) => `${count} ${REJECTION_LABELS[reason]}`)
    .join(", ");

  return `Ignored ${rejectedActions.length} invalid AI action suggestion${rejectedActions.length === 1 ? "" : "s"}: ${details}.`;
}
