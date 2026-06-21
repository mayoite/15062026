
const ANNOTATION_PREFIX = "DRAW:";

export function isFabricAnnotation(obj: any): boolean {
  return String(obj?.name ?? "").startsWith(ANNOTATION_PREFIX);
}

export function canResizeFabricObject(obj: any): boolean {
  if (!obj) return false;
  const name = String(obj.name ?? "");
  if (name.startsWith(ANNOTATION_PREFIX)) return true;
  if (name.startsWith("MISCELLANEOUS")) return true;
  if (name.startsWith("TEXT")) return true;
  return false;
}

export function canEditFabricFill(obj: any): boolean {
  if (!obj) return false;
  if (canResizeFabricObject(obj)) return true;
  const name = String(obj.name ?? "");
  return name.startsWith("GROUP") || name === "GROUP";
}

export function applyFabricTransformLocks(obj: any) {
  if (!obj) return;
  const resizable = canResizeFabricObject(obj);
  obj.lockScalingX = !resizable;
  obj.lockScalingY = !resizable;
  obj.lockRotation = !resizable;
  obj.hasControls = resizable || obj.hasControls !== false;
  obj.hasBorders = true;
  if (resizable && typeof obj.setControlsVisibility === "function") {
    obj.setControlsVisibility({
      mt: true,
      mb: true,
      ml: true,
      mr: true,
      tl: true,
      tr: true,
      bl: true,
      br: true,
      mtr: true,
    });
  }
}