import { suggestLayoutGridPack } from "@/features/planner/ai/spaceSuggest";
import type { SpaceSuggestInput } from "@/features/planner/ai/types";
import {
  metadataToSpaceSuggestInput,
  type PlannerPrimaryPurpose,
} from "@/features/planner/onboarding/projectSetup";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";

const DEFAULT_QUICK_LAYOUT_INPUT: SpaceSuggestInput = {
  seatCount: 12,
  purpose: "mixed" satisfies PlannerPrimaryPurpose,
  floorAreaSqFt: 2000,
};

/** Queue a grid-packed starter layout from project metadata (or sensible defaults). */
export function queueQuickStarterLayout(): void {
  const { projectMetadata, setPendingBootstrapLayout } = usePlannerWorkspaceStore.getState();
  const input = projectMetadata
    ? metadataToSpaceSuggestInput(projectMetadata)
    : DEFAULT_QUICK_LAYOUT_INPUT;
  setPendingBootstrapLayout(suggestLayoutGridPack(input));
}
