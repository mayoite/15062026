export function moveBlueprintFromPageDelta(
  origin: { x: number; y: number },
  delta: { x: number; y: number },
) {
  return {
    x: origin.x + delta.x,
    y: origin.y + delta.y,
  };
}

export function getBlueprintScreenFrame(input: {
  pageTopLeft: { x: number; y: number };
  widthPx: number;
  heightPx: number;
  scale: number;
}) {
  const width = input.widthPx * input.scale;
  const height = input.heightPx * input.scale;

  return {
    left: input.pageTopLeft.x,
    top: input.pageTopLeft.y,
    width,
    height,
    centerX: input.pageTopLeft.x + width / 2,
    centerY: input.pageTopLeft.y + height / 2,
  };
}
