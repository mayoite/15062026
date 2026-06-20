export type PlannerWorkspacePreferences = {
  leftOpen: boolean;
  rightOpen: boolean;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  viewMode: "2d" | "3d" | "split";
  catalogQuery: string;
};

export const PLANNER_WORKSPACE_PREFERENCES_KEY = "planner-workspace-preferences-v1";

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
