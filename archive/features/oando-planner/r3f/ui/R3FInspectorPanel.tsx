"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Ruler,
  RotateCw,
  Trash2,
  Copy,
  PanelRightClose,
  PanelRightOpen,
  ChevronUp,
  ChevronDown,
  Download,
} from "lucide-react";
import { usePlannerR3FStore, type PlacedItem } from "../usePlannerR3FStore";

function Stepper({
  value,
  label,
  unit,
  step,
  min,
  onChange,
}: {
  value: number;
  label: string;
  unit: string;
  step: number;
  min: number;
  onChange: (val: number) => void;
}) {
  const inputId = `stepper-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={inputId} className="text-[12px] text-neutral-600 whitespace-nowrap">{label}</label>
      <div className="flex items-center gap-0">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(min, value - step))}
          className="flex h-7 w-6 items-center justify-center rounded-l-md border border-neutral-200 bg-neutral-50 text-neutral-500 hover:bg-neutral-100 transition"
        >
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        </button>
        <input
          id={inputId}
          type="number"
          value={value}
          onChange={(e) => {
            const num = parseInt(e.target.value, 10);
            if (!isNaN(num) && num > 0) onChange(num);
          }}
          className="h-7 w-20 border-y border-neutral-200 bg-white px-2 text-center text-[12px] text-neutral-800 outline-none focus:border-blue-400"
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(value + step)}
          className="flex h-7 w-6 items-center justify-center rounded-r-md border border-neutral-200 bg-neutral-50 text-neutral-500 hover:bg-neutral-100 transition"
        >
          <ChevronUp className="h-3 w-3" aria-hidden="true" />
        </button>
        <span className="ml-1.5 text-[10px] text-neutral-400">{unit}</span>
      </div>
    </div>
  );
}

function RoomSettings() {
  const room = usePlannerR3FStore((s) => s.room);
  const setRoom = usePlannerR3FStore((s) => s.setRoom);

  const area = (room.widthMm * room.depthMm) / 1_000_000;

  return (
    <div className="space-y-3 p-3">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
        Room Settings
      </h3>
      <Stepper
        value={room.widthMm}
        label="Width"
        unit="mm"
        step={100}
        min={1000}
        onChange={(val) => setRoom({ widthMm: val })}
      />
      <Stepper
        value={room.depthMm}
        label="Depth"
        unit="mm"
        step={100}
        min={1000}
        onChange={(val) => setRoom({ depthMm: val })}
      />
      <Stepper
        value={room.wallHeightMm}
        label="Height"
        unit="mm"
        step={100}
        min={2000}
        onChange={(val) => setRoom({ wallHeightMm: val })}
      />
      <div className="rounded-lg bg-blue-50 px-3 py-2 text-[11px] text-blue-700">
        <span className="font-semibold">{area.toFixed(1)} m²</span>
        <span className="text-blue-500"> · {(area * 10.7639).toFixed(0)} sq ft</span>
      </div>
    </div>
  );
}

function RotationSlider({ value, onChange }: { value: number; onChange: (deg: number) => void }) {
  const deg = Math.round((value * 180) / Math.PI);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-600">
          <RotateCw className="h-3 w-3 text-neutral-400" aria-hidden="true" />
          Rotation
        </div>
        <span className="text-[11px] font-medium text-neutral-700">{deg}°</span>
      </div>
      <input
        type="range"
        min={0}
        max={360}
        value={(deg + 360) % 360}
        onChange={(e) => {
          const newDeg = parseInt(e.target.value, 10);
          onChange((newDeg * Math.PI) / 180);
        }}
        aria-label={`Rotation: ${deg} degrees`}
        className="w-full h-1.5 rounded-full appearance-none bg-neutral-200 accent-blue-600 cursor-pointer"
      />
    </div>
  );
}

function ItemDetails({ item }: { item: PlacedItem }) {
  const removeItem = usePlannerR3FStore((s) => s.removeItem);
  const duplicateItem = usePlannerR3FStore((s) => s.duplicateItem);
  const updateItem = usePlannerR3FStore((s) => s.updateItem);

  return (
    <div className="space-y-3 p-3">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
        Selected Item
      </h3>
      <div>
        <p className="text-[14px] font-semibold text-neutral-800">{item.name}</p>
        <span className="inline-block mt-0.5 rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase text-neutral-500">
          {item.category}
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-[11px] text-neutral-600">
          <Ruler className="h-3 w-3 text-neutral-400" aria-hidden="true" />
          {item.widthMm} × {item.depthMm} × {item.heightMm} mm
        </div>
        <div className="flex items-center gap-2 text-[11px] text-neutral-600">
          <Box className="h-3 w-3 text-neutral-400" aria-hidden="true" />
          X: {(item.position[0] * 1000).toFixed(0)} · Z: {(item.position[2] * 1000).toFixed(0)} mm
        </div>
      </div>

      <RotationSlider
        value={item.rotation}
        onChange={(rad) => updateItem(item.id, { rotation: rad })}
      />

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => duplicateItem(item.id)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 py-1.5 text-[11px] font-medium text-neutral-600 hover:bg-neutral-50 transition"
        >
          <Copy className="h-3 w-3" aria-hidden="true" /> Duplicate
        </button>
        <button
          type="button"
          onClick={() => removeItem(item.id)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 py-1.5 text-[11px] font-medium text-red-500 hover:bg-red-50 transition"
        >
          <Trash2 className="h-3 w-3" aria-hidden="true" /> Delete
        </button>
      </div>
    </div>
  );
}

type BoqGroup = { name: string; category: string; meshType: string; dims: string; qty: number };

function BoqPanel() {
  const items = usePlannerR3FStore((s) => s.items);

  const boqLines = useMemo(() => {
    const map = new Map<string, BoqGroup>();
    for (const item of items) {
      const key = `${item.catalogId}|${item.widthMm}x${item.depthMm}x${item.heightMm}|${item.category}`;
      const existing = map.get(key);
      if (existing) {
        existing.qty += 1;
      } else {
        map.set(key, {
          name: item.name,
          category: item.category,
          meshType: item.meshType,
          dims: `${item.widthMm} × ${item.depthMm} × ${item.heightMm}`,
          qty: 1,
        });
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
    );
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <Box className="h-6 w-6 text-neutral-300 mb-2" />
        <p className="text-[13px] font-medium text-neutral-500">No items placed</p>
        <p className="text-[11px] text-neutral-400">Add items from the catalog</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-neutral-100">
      {boqLines.map((line, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-blue-50 text-[11px] font-bold text-blue-600">
            {line.qty}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-neutral-800 truncate">{line.name}</p>
            <p className="text-[10px] text-neutral-400">{line.dims} mm</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function R3FInspectorPanel({ onExportBoq }: { onExportBoq?: () => void }) {
  const selectedId = usePlannerR3FStore((s) => s.selectedId);
  const items = usePlannerR3FStore((s) => s.items);
  const selectedItem = selectedId ? items.find((i) => i.id === selectedId) : null;
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth < 768;
    return false;
  });

  const lineCount = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const item of items) {
      map.set(`${item.catalogId}|${item.widthMm}x${item.depthMm}x${item.heightMm}`, true);
    }
    return map.size;
  }, [items]);

  return (
    <>
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="absolute right-2 top-14 z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white shadow-sm md:hidden"
        aria-label={collapsed ? "Show inspector" : "Hide inspector"}
      >
        {collapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
      </button>
      <div
        className={`${
          collapsed
            ? "hidden"
            : "absolute inset-y-0 right-0 z-10 w-72 md:relative md:z-auto"
        } flex h-full w-72 flex-col border-l border-neutral-200 bg-white`}
      >
        <div className="shrink-0 border-b border-neutral-200 px-3 py-2.5">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
            Inspector
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-200">
          <RoomSettings />
          {selectedItem && <ItemDetails item={selectedItem} />}
          <div>
            <div className="px-3 pt-3 pb-1">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Bill of Quantities
              </h3>
            </div>
            <BoqPanel />
          </div>
        </div>
        <div className="shrink-0 border-t border-neutral-200 px-3 py-2.5 flex items-center justify-between bg-neutral-50">
          <span className="text-[10px] font-medium text-neutral-500">
            {lineCount} line{lineCount !== 1 ? "s" : ""} · {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
          {onExportBoq && items.length > 0 && (
            <button
              type="button"
              onClick={onExportBoq}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-500 transition"
            >
              <Download className="h-3 w-3" />
              Export BOQ
            </button>
          )}
        </div>
      </div>
    </>
  );
}
