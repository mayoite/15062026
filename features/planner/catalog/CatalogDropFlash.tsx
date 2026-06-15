"use client";

interface CatalogDropFlashProps {
  x: number;
  y: number;
}

export function CatalogDropFlash({ x, y }: CatalogDropFlashProps) {
  return (
    <div
      className="pw-drop-flash"
      style={{ left: x, top: y }}
      aria-hidden
    />
  );
}