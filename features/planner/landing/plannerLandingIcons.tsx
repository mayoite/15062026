import {
  Cube,
  Export,
  Layout,
  Sparkle,
  UploadSimple,
  type IconProps,
} from "@phosphor-icons/react";

export type PlannerLandingIcon = React.ComponentType<IconProps>;

export const PLANNER_LANDING_ICONS: Record<string, PlannerLandingIcon> = {
  catalog: Layout,
  "3d-view": Cube,
  export: Export,
  "ai-assist": Sparkle,
};
