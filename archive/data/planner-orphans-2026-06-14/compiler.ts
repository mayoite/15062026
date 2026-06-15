import { Editor, createTLStore, defaultShapeUtils, defaultBindingUtils, defaultTools, loadSnapshot } from 'tldraw';
import type { WallEntity, ItemEntity } from './envelope';

/**
 * The Compiler converts messy tldraw sketches into precise Envelope geometry.
 * This runs "headlessly" without the <Tldraw /> React component.
 */
export class CanvasCompiler {
  private editor: Editor;

  constructor() {
    // Instantiate a headless tldraw editor using their v2 API
    const store = createTLStore({ shapeUtils: defaultShapeUtils });
    this.editor = new Editor({ 
      store, 
      shapeUtils: defaultShapeUtils,
      bindingUtils: defaultBindingUtils,
      tools: defaultTools,
      getContainer: () => document.createElement('div')
    });
  }

  /**
   * Loads raw JSON snapshot from tldraw and compiles it to strict geometry.
   */
  public compile(snapshotJson: string): { walls: WallEntity[], items: ItemEntity[] } {
    try {
      const snapshot = JSON.parse(snapshotJson);
      loadSnapshot(this.editor.store, snapshot);
      
      const walls: WallEntity[] = [];
      const items: ItemEntity[] = [];
      
      const shapes = this.editor.getCurrentPageShapes();
      
      for (const shape of shapes) {
        if (shape.type === 'line' || shape.type === 'draw') {
          // Heuristic: If it's a line/draw, assume it's a wall.
          // In a real heuristic, we'd snap points to 90 degrees and calculate thickness.
          walls.push({
            id: `wall_${shape.id}`,
            start: [shape.x, shape.y],
            // Note: tldraw 'line' shapes have internal points we'd parse.
            // For this structural spike, we mock the end point.
            end: [shape.x + 100, shape.y], 
            height: 3, // Default 3 meters high
            thickness: 0.1, // 10cm standard wall
          });
        }
        
        if (shape.type === 'geo' && shape.props) {
          // Heuristic: If it's a rectangle, assume it's a desk/item placeholder
          items.push({
            id: `item_${shape.id}`,
            sku: 'GENERIC-DESK-01',
            position: [shape.x, 0, shape.y], // mapped to 3D space (Y is up)
            rotation: shape.rotation * (180 / Math.PI), // Rad to Deg
            dimensions: { width: 1.2, height: 0.75, depth: 0.6 }
          });
        }
      }

      return { walls, items };
    } catch (e) {
      console.error("CanvasCompiler failed to parse snapshot:", e);
      return { walls: [], items: [] };
    }
  }
}
