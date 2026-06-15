interface ViewportSize {
  width: number
  height: number
}

const FALLBACK_VIEWPORT_SIZE: ViewportSize = { width: 800, height: 600 }

function firstDrawable(...values: number[]): number {
  for (const value of values) {
    if (Number.isFinite(value) && value > 0) return value
  }
  return 0
}

export function coerceMinimapViewportSize(
  stage: ViewportSize,
  browser: ViewportSize | null,
): ViewportSize {
  return {
    width: firstDrawable(
      stage.width,
      browser?.width ?? 0,
      FALLBACK_VIEWPORT_SIZE.width,
    ),
    height: firstDrawable(
      stage.height,
      browser?.height ?? 0,
      FALLBACK_VIEWPORT_SIZE.height,
    ),
  }
}
