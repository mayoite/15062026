declare module "konva" {
  namespace Konva {
    class Stage {
      toDataURL(config?: Record<string, unknown>): string;
      width(): number;
      height(): number;
      scaleX(): number;
      scaleY(): number;
      x(): number;
      y(): number;
      position(pos?: { x: number; y: number }): { x: number; y: number };
      batchDraw(): void;
      find(selector: string): unknown[];
      getLayers(): unknown[];
      container(): HTMLDivElement;
      destroy(): void;
    }
  }
  export default Konva;
}
