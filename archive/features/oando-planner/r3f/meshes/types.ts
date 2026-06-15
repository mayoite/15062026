import type { MeshFamily } from "@/features/planner/shared/mesh-contract";

export type MeshPalette = {
  primary: string;
  secondary: string;
  accent: string;
  metal: string;
};

export type MeshDimensions = {
  width: number;
  depth: number;
  height: number;
};

export type { MeshFamily };

export type MeshProps = MeshDimensions & {
  palette: MeshPalette;
};

export const DEFAULT_PALETTE: MeshPalette = {
  primary: "var(--border-soft)",
  secondary: "var(--surface-panel)",
  accent: "var(--border-soft)",
  metal: "var(--border-soft)",
};
