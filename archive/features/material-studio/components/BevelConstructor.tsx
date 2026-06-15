'use client';

import React, { useState } from 'react';
import { useMaterialStudioStore } from '../stores/useMaterialStudioStore';

export function BevelConstructor() {
  const initialSize = useMaterialStudioStore.getState().tokens['bevel-size'];
  const initialRoundness = useMaterialStudioStore.getState().tokens['bevel-roundness'];
  const updateToken = useMaterialStudioStore((state) => state.updateToken);

  const [size, setSize] = useState(initialSize);
  const [roundness, setRoundness] = useState(initialRoundness);

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSize(val);
    updateToken('bevel-size', val);
  };

  const handleRoundnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setRoundness(val);
    updateToken('bevel-roundness', val);
  };

  return (
    <div className="flex flex-col gap-4 p-4 border border-slate-200 rounded-lg dark:border-slate-800">
      <h3 className="font-semibold text-lg">Bevel Constructor</h3>
      
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <label htmlFor="bevel-size" className="text-sm font-medium">Bevel Size</label>
          <span className="text-sm text-slate-500">{size.toFixed(2)} mm</span>
        </div>
        <input 
          id="bevel-size"
          type="range" 
          min="0" max="10" step="0.1" 
          value={size} 
          onChange={handleSizeChange}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <label htmlFor="bevel-roundness" className="text-sm font-medium">Bevel Roundness</label>
          <span className="text-sm text-slate-500">{roundness.toFixed(2)}</span>
        </div>
        <input 
          id="bevel-roundness"
          type="range" 
          min="0" max="1" step="0.01" 
          value={roundness} 
          onChange={handleRoundnessChange}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
        />
      </div>
      
      {/* Visual Preview (2D DOM injection test) */}
      <div className="mt-4 p-4 flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-md">
        <div 
          className="w-20 h-20 bg-[var(--ms-color-base,#fff)] shadow-lg transition-all"
          style={{ 
            borderRadius: `calc(var(--ms-bevel-size, 0) * 1px)`,
            border: `calc(var(--ms-bevel-roundness, 0) * 5px) solid var(--ms-color-bevel, #ccc)`
          }}
        />
      </div>
    </div>
  );
}
