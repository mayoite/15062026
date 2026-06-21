import { useState, useCallback, useEffect, useMemo } from "react";
import type { CatalogItem } from "../catalog/catalogTypes";
import { acceptsCatalogDrag, readCatalogDragPayload } from "../catalog/shapeTypeRegistry";

export function usePlannerCatalogDrop({
  canvasSurfaceRef,
  placeCatalogIntoFabric,
  recordRecentPlacement,
}: {
  canvasSurfaceRef: React.RefObject<HTMLElement | null>;
  placeCatalogIntoFabric: (item: CatalogItem) => void;
  recordRecentPlacement: (id: string) => void;
}) {
  const [dragItem, setDragItem] = useState<CatalogItem | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
  const [isCatalogOverCanvas, setIsCatalogOverCanvas] = useState(false);
  const [dropFlash, setDropFlash] = useState<{ x: number; y: number } | null>(null);

  const clearCatalogDrag = useCallback(() => {
    setDragItem(null);
    setGhostPos(null);
    setIsCatalogOverCanvas(false);
  }, []);

  const handleCatalogDragStart = useCallback((item: CatalogItem) => {
    setDragItem(item);
    setIsCatalogOverCanvas(false);
  }, []);

  const handleCatalogDragEnd = useCallback(() => {
    clearCatalogDrag();
  }, [clearCatalogDrag]);

  useEffect(() => {
    if (!dragItem) return;

    const onDragOver = (event: globalThis.DragEvent) => {
      if (!event.dataTransfer || !acceptsCatalogDrag(event.dataTransfer)) return;
      event.preventDefault();
      setGhostPos({ x: event.clientX, y: event.clientY });
      const overCanvas = canvasSurfaceRef.current?.contains(event.target as Node) ?? false;
      setIsCatalogOverCanvas(overCanvas);
      event.dataTransfer.dropEffect = overCanvas ? "copy" : "none";
    };

    const onDragEnd = () => {
      clearCatalogDrag();
    };

    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragend", onDragEnd);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragend", onDragEnd);
    };
  }, [clearCatalogDrag, dragItem, canvasSurfaceRef]);

  useEffect(() => {
    if (!dropFlash) return;
    const timer = window.setTimeout(() => setDropFlash(null), 520);
    return () => window.clearTimeout(timer);
  }, [dropFlash]);

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    if (!acceptsCatalogDrag(e.dataTransfer)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setGhostPos({ x: e.clientX, y: e.clientY });
    setIsCatalogOverCanvas(true);
  }, []);

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const raw = readCatalogDragPayload(e.dataTransfer);
    if (!raw) {
      clearCatalogDrag();
      return;
    }
    try {
      const item = JSON.parse(raw) as CatalogItem;
      placeCatalogIntoFabric(item);
      recordRecentPlacement(item.id);
      setDropFlash({ x: e.clientX, y: e.clientY });
    } catch {
      // Invalid drag payload
    } finally {
      clearCatalogDrag();
    }
  }, [clearCatalogDrag, placeCatalogIntoFabric, recordRecentPlacement]);

  const ghostFootprint = useMemo(() => {
    if (!dragItem) return null;
    return { w: 48, h: 32 };
  }, [dragItem]);

  return {
    dragItem,
    ghostPos,
    isCatalogOverCanvas,
    dropFlash,
    ghostFootprint,
    handleCatalogDragStart,
    handleCatalogDragEnd,
    handleCanvasDragOver,
    handleCanvasDrop,
  };
}
