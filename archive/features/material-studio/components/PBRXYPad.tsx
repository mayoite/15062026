'use client';

import React, { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useMaterialStudioStore } from '../stores/useMaterialStudioStore';

interface PBRXYPadProps {
  width?: number;
  height?: number;
}

export function PBRXYPad({ width = 200, height = 200 }: PBRXYPadProps) {
  const padRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // We read the initial value but avoid subscribing to high-frequency updates
  const initialRoughness = useMaterialStudioStore.getState().tokens['material-roughness'];
  const initialMetalness = useMaterialStudioStore.getState().tokens['material-metalness'];
  const updateToken = useMaterialStudioStore((state) => state.updateToken);

  const [localRoughness, setLocalRoughness] = useState(initialRoughness);
  const [localMetalness, setLocalMetalness] = useState(initialMetalness);

  const handleInteraction = (clientX: number, clientY: number) => {
    if (!padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height));

    const roughness = x / rect.width;
    // Invert Y so top is 1, bottom is 0 for metalness, or just standard 0-1
    const metalness = 1 - (y / rect.height);

    setLocalRoughness(roughness);
    setLocalMetalness(metalness);

    // Update the store (which bypasses React rendering for 2D/3D targets)
    updateToken('material-roughness', roughness);
    updateToken('material-metalness', metalness);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    handleInteraction(e.clientX, e.clientY);
    
    // Pointer capture allows us to track outside the div
    if (padRef.current) {
      padRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    handleInteraction(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if (padRef.current) {
      padRef.current.releasePointerCapture(e.pointerId);
    }
  };

  // Keyboard accessibility handled by the hidden range inputs
  const handleRoughnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setLocalRoughness(val);
    updateToken('material-roughness', val);
  };

  const handleMetalnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setLocalMetalness(val);
    updateToken('material-metalness', val);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, axis: 'x' | 'y') => {
    const step = 0.05;
    const createChangeEvent = (val: number) => ({ target: { value: String(val) } } as unknown as React.ChangeEvent<HTMLInputElement>);
    
    if (axis === 'x') {
      if (e.key === 'ArrowRight') handleRoughnessChange(createChangeEvent(Math.min(1, localRoughness + step)));
      if (e.key === 'ArrowLeft') handleRoughnessChange(createChangeEvent(Math.max(0, localRoughness - step)));
    } else {
      if (e.key === 'ArrowUp') handleMetalnessChange(createChangeEvent(Math.min(1, localMetalness + step)));
      if (e.key === 'ArrowDown') handleMetalnessChange(createChangeEvent(Math.max(0, localMetalness - step)));
    }
  };

  const thumbX = localRoughness * width;
  const thumbY = (1 - localMetalness) * height;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-sm font-medium">
        <span>Roughness (X): {localRoughness.toFixed(2)}</span>
        <span>Metalness (Y): {localMetalness.toFixed(2)}</span>
      </div>
      
      {/* Visual XY Pad */}
      <div 
        ref={padRef}
        className="relative border border-slate-300 rounded-md bg-slate-100 dark:bg-slate-800 touch-none select-none overflow-hidden cursor-crosshair"
        style={{ width, height }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Visual grid / background pattern */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
        
        {/* Thumb */}
        <div 
          className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: thumbX, top: thumbY }}
        />
      </div>

      {/* Visually hidden but accessible range inputs */}
      <div className="sr-only">
        <label htmlFor="roughness-input">Roughness</label>
        <input 
          id="roughness-input"
          type="range" 
          min="0" max="1" step="0.01" 
          value={localRoughness} 
          onChange={handleRoughnessChange}
          onKeyDown={(e) => handleKeyDown(e, 'x')}
          aria-label="Roughness"
        />
        
        <label htmlFor="metalness-input">Metalness</label>
        <input 
          id="metalness-input"
          type="range" 
          min="0" max="1" step="0.01" 
          value={localMetalness} 
          onChange={handleMetalnessChange}
          onKeyDown={(e) => handleKeyDown(e, 'y')}
          aria-label="Metalness"
        />
      </div>
    </div>
  );
}
