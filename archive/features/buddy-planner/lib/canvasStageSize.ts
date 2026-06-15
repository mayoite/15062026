export interface CanvasStageSize {
  width: number
  height: number
}

const FALLBACK_STAGE_SIZE: CanvasStageSize = { width: 800, height: 600 }

function drawableDimension(value: number, previous: number, fallback: number): number {
  if (Number.isFinite(value) && value > 0) return value
  if (Number.isFinite(previous) && previous > 0) return previous
  return fallback
}

export function coerceCanvasStageSize(
  measured: CanvasStageSize,
  previous: CanvasStageSize,
): CanvasStageSize {
  return {
    width: drawableDimension(measured.width, previous.width, FALLBACK_STAGE_SIZE.width),
    height: drawableDimension(measured.height, previous.height, FALLBACK_STAGE_SIZE.height),
  }
}
