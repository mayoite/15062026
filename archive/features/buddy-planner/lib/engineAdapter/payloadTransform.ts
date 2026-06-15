import type { CanvasElement } from '../../types/elements'

// Tldraw Payload Transforms

export function toTldrawPayload(elements: Record<string, CanvasElement>) {
  // Convert our CanvasElements to Tldraw shape
  // Stub implementation for Phase 5-D
  const tlElements: Record<string, unknown> = {}
  for (const [id, el] of Object.entries(elements)) {
    tlElements[id] = {
      id: `shape:${id}`,
      type: 'geo',
      x: el.x,
      y: el.y,
      props: {
        w: el.width || 100,
        h: el.height || 100,
        geo: 'rectangle',
        fill: 'solid',
        color: 'black'
      }
    }
  }
  return tlElements
}

 
export function fromTldrawPayload(_tlElements: unknown): Record<string, CanvasElement> {
  // Stub implementation for Phase 5-D
  const elements: Record<string, CanvasElement> = {}
  return elements
}

// Excalidraw Payload Transforms

export function toExcalidrawPayload(elements: Record<string, CanvasElement>) {
  // Stub implementation for Phase 5-D
  const exElements: unknown[] = []
  for (const [id, el] of Object.entries(elements)) {
    exElements.push({
      id,
      type: 'rectangle',
      x: el.x,
      y: el.y,
      width: el.width || 100,
      height: el.height || 100,
      strokeColor: 'var(--text-body)',
      backgroundColor: 'transparent',
    })
  }
  return exElements
}

 
export function fromExcalidrawPayload(_exElements: unknown): Record<string, CanvasElement> {
  // Stub implementation for Phase 5-D
  const elements: Record<string, CanvasElement> = {}
  return elements
}



