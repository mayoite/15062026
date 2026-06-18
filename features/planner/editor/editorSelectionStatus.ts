import { getPlannerFabricRuntimeState } from "@/features/planner/canvas-fabric";

export function getEditorSelectionStatus(_editor?: null): string | null {
  const selections = getPlannerFabricRuntimeState().selections;
  if (!selections.length) return null;
  if (selections.length > 1) return `${selections.length} items`;

  const selected = selections[0];
  const name = String(selected?.name ?? "").trim();
  if (!name) return "1 item";

  const parts = name.split(":");
  return (parts.slice(1).join(":") || parts[0] || "1 item").trim();
}
