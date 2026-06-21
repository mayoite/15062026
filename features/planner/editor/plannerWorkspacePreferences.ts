export type PlannerWorkspacePreferences = {
  leftOpen: boolean;
  rightOpen: boolean;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  viewMode: "2d" | "3d" | "split";
  catalogQuery: string;
};

export const PLANNER_WORKSPACE_PREFERENCES_KEY = "planner-workspace-preferences-v1";

/**
 * Intended chrome defaults — update tests when these change, not the other way around.
 *
 *  leftOpen:  true  — left panel opens immediately on fresh load.
 *                     Rationale: canvas-first design; catalog must be reachable without a click.
 *                     Step-based override applies after manual override is cleared.
 *
 *  rightOpen: false — properties panel is closed by default.
 *                     Rationale: nothing is selected on load; an empty inspector adds noise.
 *
 *  viewMode:  "2d"  — 2D Fabric canvas is the primary editing surface.
 *
 * Tests that assert a panel is CLOSED must close it explicitly first when leftOpen=true.
 */
export const PLANNER_WORKSPACE_DEFAULTS: PlannerWorkspacePreferences = {
  leftOpen: true,
  rightOpen: false,
  leftCollapsed: false,
  rightCollapsed: false,
  viewMode: "2d",
  catalogQuery: "",
};

export function readPlannerWorkspacePreferences(): PlannerWorkspacePreferences {
  if (typeof window === "undefined") return { ...PLANNER_WORKSPACE_DEFAULTS };
  try {
    const value = JSON.parse(localStorage.getItem(PLANNER_WORKSPACE_PREFERENCES_KEY) ?? "{}");
    return {
      leftOpen: typeof value.leftOpen === "boolean" ? value.leftOpen : PLANNER_WORKSPACE_DEFAULTS.leftOpen,
      rightOpen: typeof value.rightOpen === "boolean" ? value.rightOpen : PLANNER_WORKSPACE_DEFAULTS.rightOpen,
      leftCollapsed: typeof value.leftCollapsed === "boolean" ? value.leftCollapsed : false,
      rightCollapsed: typeof value.rightCollapsed === "boolean" ? value.rightCollapsed : false,
      viewMode: value.viewMode === "3d" || value.viewMode === "split" ? value.viewMode : "2d",
      catalogQuery: typeof value.catalogQuery === "string" ? value.catalogQuery : "",
    };
  } catch {
    return { ...PLANNER_WORKSPACE_DEFAULTS };
  }
}

export function writePlannerWorkspacePreferences(patch: Partial<PlannerWorkspacePreferences>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      PLANNER_WORKSPACE_PREFERENCES_KEY,
      JSON.stringify({ ...readPlannerWorkspacePreferences(), ...patch }),
    );
  } catch {
    // Storage may be unavailable in private browsing.
  }
}
