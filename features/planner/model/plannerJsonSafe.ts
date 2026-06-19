import type { PlannerJsonValue } from "./plannerDocument";

/**
 * Coerce arbitrary runtime data (snapshots, sparse objects) into a tree
 * that satisfies plannerJsonValueSchema: no undefined keys/values, finite numbers only.
 */
export function toPlannerJsonSafe(value: unknown): PlannerJsonValue {
  if (value === null) return null;

  if (value === undefined) {
    return {};
  }

  if (typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (Array.isArray(value)) {
    return value
      .filter((entry) => entry !== undefined)
      .map((entry) => toPlannerJsonSafe(entry));
  }

  if (typeof value === "object") {
    const out: Record<string, PlannerJsonValue> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (entry === undefined) continue;
      out[key] = toPlannerJsonSafe(entry);
    }
    return out;
  }

  return {};
}