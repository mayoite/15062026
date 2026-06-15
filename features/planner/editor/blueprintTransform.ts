export const MIN_BLUEPRINT_SCALE = 0.25;
export const MAX_BLUEPRINT_SCALE = 4;
export const DEFAULT_BLUEPRINT_NUDGE = 50;
export const MIN_BLUEPRINT_OPACITY = 0.1;
export const MAX_BLUEPRINT_OPACITY = 1;

export function clampBlueprintScale(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_BLUEPRINT_SCALE, Math.max(MIN_BLUEPRINT_SCALE, value));
}

export function clampBlueprintOpacity(value: number) {
  if (!Number.isFinite(value)) return 0.45;
  return Math.min(MAX_BLUEPRINT_OPACITY, Math.max(MIN_BLUEPRINT_OPACITY, value));
}

export function formatBlueprintScalePercent(scale: number) {
  return `${Math.round(clampBlueprintScale(scale) * 100)}%`;
}

export function stepBlueprintOpacity(
  opacity: number,
  direction: "up" | "down",
  step = 0.1,
) {
  const next = direction === "up" ? opacity + step : opacity - step;
  return clampBlueprintOpacity(next);
}

export function nudgeBlueprintOffset(
  position: { x: number; y: number },
  direction: "left" | "right" | "up" | "down",
  step = DEFAULT_BLUEPRINT_NUDGE,
) {
  switch (direction) {
    case "left":
      return { x: position.x - step, y: position.y };
    case "right":
      return { x: position.x + step, y: position.y };
    case "up":
      return { x: position.x, y: position.y - step };
    case "down":
      return { x: position.x, y: position.y + step };
    default:
      return position;
  }
}
