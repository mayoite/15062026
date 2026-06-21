export type FabricDrawTool =
  | "select"
  | "line"
  | "measure"
  | "curve"
  | "rectangle"
  | "pen"
  | "eraser"
  | "wall";

export const FABRIC_DRAW_TOOL_COLORS = [
  "#111111",
  "#e53935",
  "#1e88e5",
  "#43a047",
  "#fb8c00",
  "#8e24aa",
] as const;

export const DEFAULT_FABRIC_DRAW_COLOR = FABRIC_DRAW_TOOL_COLORS[0];
export const DEFAULT_FABRIC_FILL_COLOR = "transparent";

export type FabricContextMenuState = {
  clientX: number;
  clientY: number;
  target: Record<string, unknown> | null;
};