'use client';

import React from 'react';
import { useMaterialStudioStore } from '../stores/useMaterialStudioStore';
import type { ThemeName } from '../stores/useMaterialStudioStore';
import { PBRXYPad } from './PBRXYPad';
import { BevelConstructor } from './BevelConstructor';

export function AdminPanel() {
  const theme = useMaterialStudioStore((state) => state.theme);
  const setTheme = useMaterialStudioStore((state) => state.setTheme);

  const handleThemeChange = (newTheme: ThemeName) => {
    setTheme(newTheme);
  };

  return (
    <div className="w-full max-w-md p-6 bg-white dark:bg-slate-950 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Material Studio</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Hyper-realistic rendering engine token configuration.
        </p>
      </div>

      <div className="space-y-6">
        {/* Theme Prototyping Toggle */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">Base Theme</label>
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
            <button
              onClick={() => handleThemeChange('premium-light')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                theme === 'premium-light' 
                  ? 'bg-white dark:bg-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Premium Light
            </button>
            <button
              onClick={() => handleThemeChange('executive-dark')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                theme === 'executive-dark' 
                  ? 'bg-white dark:bg-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Executive Dark
            </button>
          </div>
        </div>

        {/* PBR Settings */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">PBR Surface Properties</h3>
          <PBRXYPad width={350} height={200} />
        </div>

        {/* Bevel Settings */}
        <BevelConstructor />
      </div>
    </div>
  );
}
