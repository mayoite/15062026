import {
  normalizePlannerChromePlacement,
  PLANNER_CHROME_DEFAULTS,
} from "@/features/planner/editor/chrome/plannerChromeLayout";
import type {
  LegacyPlannerChromeDockId,
  PlannerChromeDockId,
  PlannerChromeLayoutState,
  PlannerChromeDockPlacement,
} from "@/features/planner/editor/chrome/plannerChromeTypes";

export const LEGACY_PLANNER_CHROME_DOCK_STORAGE_KEY = "planner-chrome-dock-v1";
export const PLANNER_CHROME_LAYOUT_STORAGE_KEY = "planner-chrome-layout-v2";

type LegacyPlannerChromeLayoutState = Partial<Record<LegacyPlannerChromeDockId, PlannerChromeDockPlacement>>;

type PlannerChromeLayoutEnvelope = {
  version: 2;
  placements: Partial<Record<PlannerChromeDockId, PlannerChromeDockPlacement>>;
};

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function mergePlannerChromeLayout(
  placements: Partial<Record<PlannerChromeDockId, PlannerChromeDockPlacement>>,
): PlannerChromeLayoutState {
  return {
    tools: normalizePlannerChromePlacement(placements.tools, PLANNER_CHROME_DEFAULTS.tools),
    steps: normalizePlannerChromePlacement(placements.steps, PLANNER_CHROME_DEFAULTS.steps),
    access: normalizePlannerChromePlacement(placements.access, PLANNER_CHROME_DEFAULTS.access),
  };
}

function readLegacyPlannerChromeLayout(storage: Storage): PlannerChromeLayoutState {
  try {
    const raw = storage.getItem(LEGACY_PLANNER_CHROME_DOCK_STORAGE_KEY);
    if (!raw) return { ...PLANNER_CHROME_DEFAULTS };
    const parsed = JSON.parse(raw) as LegacyPlannerChromeLayoutState;

    return {
      tools: normalizePlannerChromePlacement(parsed.tools, PLANNER_CHROME_DEFAULTS.tools),
      steps: normalizePlannerChromePlacement(parsed.steps, PLANNER_CHROME_DEFAULTS.steps),
      access: normalizePlannerChromePlacement(
        parsed["panel-left"] ?? parsed["panel-right"],
        PLANNER_CHROME_DEFAULTS.access,
      ),
    };
  } catch {
    return { ...PLANNER_CHROME_DEFAULTS };
  }
}

export function readPlannerChromeLayout(): PlannerChromeLayoutState {
  const storage = getStorage();
  if (!storage) return { ...PLANNER_CHROME_DEFAULTS };

  try {
    const raw = storage.getItem(PLANNER_CHROME_LAYOUT_STORAGE_KEY);
    if (!raw) {
      return readLegacyPlannerChromeLayout(storage);
    }

    const parsed = JSON.parse(raw) as Partial<PlannerChromeLayoutEnvelope>;
    if (parsed.version !== 2 || !parsed.placements || typeof parsed.placements !== "object") {
      return readLegacyPlannerChromeLayout(storage);
    }

    return mergePlannerChromeLayout(parsed.placements);
  } catch {
    return readLegacyPlannerChromeLayout(storage);
  }
}

export function readPlannerChromeDockPlacement(dockId: PlannerChromeDockId): PlannerChromeDockPlacement {
  return readPlannerChromeLayout()[dockId];
}

export function writePlannerChromeLayout(layout: PlannerChromeLayoutState): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    const envelope: PlannerChromeLayoutEnvelope = {
      version: 2,
      placements: mergePlannerChromeLayout(layout),
    };
    storage.setItem(PLANNER_CHROME_LAYOUT_STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // Ignore storage failures in private mode or quota errors.
  }
}

export function writePlannerChromeDockPlacement(
  dockId: PlannerChromeDockId,
  placement: PlannerChromeDockPlacement,
): void {
  const nextLayout = {
    ...readPlannerChromeLayout(),
    [dockId]: normalizePlannerChromePlacement(placement, PLANNER_CHROME_DEFAULTS[dockId]),
  };
  writePlannerChromeLayout(nextLayout);
}

export function resetPlannerChromeLayout(): PlannerChromeLayoutState {
  writePlannerChromeLayout({ ...PLANNER_CHROME_DEFAULTS });
  return { ...PLANNER_CHROME_DEFAULTS };
}
