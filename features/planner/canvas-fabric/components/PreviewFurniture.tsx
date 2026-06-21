import { useEffect, useId, useRef } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { createFurniture, RL_PREVIEW_HEIGHT, RL_PREVIEW_WIDTH } from '../lib/helpers';
import { useFloorplan } from '../context/FloorplanContext';

type PreviewFurnitureProps = {
  type: string;
  furniture: Record<string, unknown>;
};

export function PreviewFurniture({ type, furniture }: PreviewFurnitureProps) {
  const canvasId = useId().replace(/:/g, '');
  const canvasRef = useRef<FabricCanvas | null>(null);
  const { defaultChair } = useFloorplan();

  useEffect(() => {
    const canvas = new FabricCanvas(canvasId);
    canvas.setDimensions({ width: RL_PREVIEW_WIDTH, height: RL_PREVIEW_HEIGHT });
    canvasRef.current = canvas;
    return () => {
      canvas.dispose();
      canvasRef.current = null;
    };
  }, [canvasId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.clear();
    const group = createFurniture(type, furniture, defaultChair ?? {});
    group.left = RL_PREVIEW_WIDTH / 2;
    group.top = RL_PREVIEW_HEIGHT / 2;
    group.selectable = false;
    group.hoverCursor = 'pointer';
    canvas.add(group);
    canvas.renderAll();
  }, [type, furniture, defaultChair]);

  return <canvas id={canvasId} className="preview-canvas" />;
}