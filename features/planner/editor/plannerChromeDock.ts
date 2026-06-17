export type {
  PlannerChromeDockEdge,
  PlannerChromeDockId,
  PlannerChromeDockPlacement,
} from "@/features/planner/editor/chrome/plannerChromeTypes";
export {
  clampDockRatio,
  normalizePlannerChromePlacement,
  PLANNER_CHROME_DEFAULTS as PLANNER_CHROME_DOCK_DEFAULTS,
  snapPlannerChromePlacement,
} from "@/features/planner/editor/chrome/plannerChromeLayout";
export {
  LEGACY_PLANNER_CHROME_DOCK_STORAGE_KEY as PLANNER_CHROME_DOCK_STORAGE_KEY,
  readPlannerChromeDockPlacement,
  writePlannerChromeDockPlacement,
} from "@/features/planner/editor/chrome/plannerChromeStorage";
