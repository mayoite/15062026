export type PlannerIdentityId = "oando" | "buddy" | "oofpl";
export type PlannerWorkflowEngine = "fabric" | "three3d";
export type PlannerRouteStatus = "canonical" | "compatibility" | "unresolved";

export interface PlannerWorkflowStage {
  id: "intake" | "refine" | "preview";
  label: string;
  engine: PlannerWorkflowEngine;
}

export interface PlannerRouteContract {
  canonical: string | null;
  guest: string | null;
  compatibility: readonly string[];
  status: PlannerRouteStatus;
}

export interface PlannerIdentityConfig {
  id: PlannerIdentityId;
  displayName: string;
  route: PlannerRouteContract;
  stages: readonly PlannerWorkflowStage[];
}

export const PLANNER_IDENTITY_CONFIGS: Record<PlannerIdentityId, PlannerIdentityConfig> = {
  oando: {
    id: "oando",
    displayName: "Workspace Planner",
    route: {
      canonical: "/planner/canvas",
      guest: "/planner/guest",
      compatibility: ["/oando-planner/canvas", "/oando-planner/guest", "/oando-planner/shared"],
      status: "canonical",
    },
    stages: [
      { id: "intake", label: "Sketch / intake", engine: "fabric" },
      { id: "refine", label: "Refine / edit", engine: "fabric" },
      { id: "preview", label: "Preview / export", engine: "three3d" },
    ],
  },
  buddy: {
    id: "buddy",
    displayName: "Workspace Planner",
    route: {
      canonical: "/planner/canvas",
      guest: "/planner/guest",
      compatibility: ["/buddy-planner/editor", "/buddy-planner/guest", "/buddy-planner/[...slug]"],
      status: "compatibility",
    },
    stages: [
      { id: "refine", label: "Edit / place", engine: "fabric" },
      { id: "preview", label: "Preview / export", engine: "three3d" },
    ],
  },
  oofpl: {
    id: "oofpl",
    displayName: "OOFPL Planner",
    route: {
      canonical: null,
      guest: null,
      compatibility: [],
      status: "unresolved",
    },
    stages: [
      { id: "refine", label: "Fabric edit", engine: "fabric" },
      { id: "preview", label: "Preview / export", engine: "three3d" },
    ],
  },
};

export function getPlannerIdentityConfig(id: PlannerIdentityId): PlannerIdentityConfig {
  return PLANNER_IDENTITY_CONFIGS[id];
}

export function listPlannerIdentityConfigs(): PlannerIdentityConfig[] {
  return (["oando", "buddy", "oofpl"] as const).map((id) => PLANNER_IDENTITY_CONFIGS[id]);
}

export function getPlannerWorkflowStages(id: PlannerIdentityId): readonly PlannerWorkflowStage[] {
  return PLANNER_IDENTITY_CONFIGS[id].stages;
}
