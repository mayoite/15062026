"use client";

import { useEffect, useRef } from 'react';
import { useFloorplan } from './context/FloorplanContext';
import { createFloorplanCanvasApi, type FloorplanCtx } from './hooks/floorplanCanvas';
import { usePlannerWorkspaceStore } from '@/features/planner/store/workspaceStore';
import { BlueprintUnderlay } from '@/features/planner/editor/BlueprintUnderlay';
import { CalibrationCapture } from '@/features/planner/editor/CalibrationCapture';
import { BlueprintMoveCapture } from '@/features/planner/editor/BlueprintMoveCapture';

export function FloorplanCanvas() {
  const ctx = useFloorplan();
  const layerVisible = usePlannerWorkspaceStore((s) => s.layerVisible);
  const canvasHostRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<FloorplanCtx>({
    roomEdit: ctx.roomEdit,
    zoom: ctx.zoom,
    gridEnabled: ctx.gridEnabled,
    states: ctx.states,
    redoStates: ctx.redoStates,
    roomEditStates: ctx.roomEditStates,
    roomEditRedoStates: ctx.roomEditRedoStates,
    defaultChair: ctx.defaultChair,
    setSelections: ctx.setSelections as unknown as FloorplanCtx['setSelections'],
    setUngroupable: ctx.setUngroupable,
    pushState: ctx.pushState,
    setStates: ctx.setStates,
    setRedoStates: ctx.setRedoStates,
    setRoomEditStates: ctx.setRoomEditStates,
    setRoomEditRedoStates: ctx.setRoomEditRedoStates,
    enterRoomEdit: ctx.editRoom,
    exitRoomEdit: ctx.endEditRoom,
    syncZoom: ctx.setZoom,
  });

  useEffect(() => {
    ctxRef.current = {
      roomEdit: ctx.roomEdit,
      zoom: ctx.zoom,
      gridEnabled: ctx.gridEnabled,
      states: ctx.states,
      redoStates: ctx.redoStates,
      roomEditStates: ctx.roomEditStates,
      roomEditRedoStates: ctx.roomEditRedoStates,
      defaultChair: ctx.defaultChair,
      setSelections: ctx.setSelections as unknown as FloorplanCtx['setSelections'],
      setUngroupable: ctx.setUngroupable,
      pushState: ctx.pushState,
      setStates: ctx.setStates,
      setRedoStates: ctx.setRedoStates,
      setRoomEditStates: ctx.setRoomEditStates,
      setRoomEditRedoStates: ctx.setRoomEditRedoStates,
      enterRoomEdit: ctx.editRoom,
      exitRoomEdit: ctx.endEditRoom,
      syncZoom: ctx.setZoom,
    };
  }, [ctx]);

  useEffect(() => {
    const el = canvasHostRef.current;
    if (!el) return;

    const api = createFloorplanCanvasApi(ctxRef, el);
    api.init();
    ctx.registerCanvasApi(api);

    const wrap = el.closest('.canvas-wrap');
    const applyFit = () => {
      if (!wrap || wrap.clientWidth < 280) return;
      const zoomPct = api.fitToStage();
      ctx.setZoom(zoomPct);
      api.recalcOffset();
    };
    const fitFrame = window.requestAnimationFrame(applyFit);

    const onKeyDown = (e: KeyboardEvent) => api.onKeyDown(e);
    const onKeyUp = (e: KeyboardEvent) => api.onKeyUp(e);
    const onViewportChange = () => applyFit();
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('orientationchange', onViewportChange);

    const resizeObserver =
      wrap && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => applyFit())
        : null;
    if (wrap) {
      resizeObserver?.observe(wrap);
    }

    return () => {
      window.cancelAnimationFrame(fitFrame);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('orientationchange', onViewportChange);
      resizeObserver?.disconnect();
      api.dispose();
      ctx.registerCanvasApi(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    ctx.setLayerVisibility(layerVisible);
  }, [ctx, layerVisible]);

  return (
    <div className="canvas-wrap" tabIndex={0}>
      <BlueprintUnderlay camera={null} />
      <canvas id="main" ref={canvasHostRef} />
      <CalibrationCapture />
      <BlueprintMoveCapture />
    </div>
  );
}
