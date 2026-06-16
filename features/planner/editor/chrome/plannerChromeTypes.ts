export type PlannerChromeDockId = "tools" | "steps" | "access";

export type PlannerChromeDockEdge = "left" | "right" | "top" | "bottom" | "free";

export type PlannerChromeDockPlacement = {
  edge: PlannerChromeDockEdge;
  offset: number;
  x?: number;
  y?: number;
};

export type PlannerChromeLayoutState = Record<PlannerChromeDockId, PlannerChromeDockPlacement>;

export type LegacyPlannerChromeDockId = "tools" | "steps" | "panel-left" | "panel-right";

export type PlannerChromeWidgetSize = {
  width: number;
  height: number;
};

export type PlannerChromeReservedInsets = Partial<{
  left: number;
  right: number;
  top: number;
  bottom: number;
}>;
