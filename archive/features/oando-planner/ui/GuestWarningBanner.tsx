import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  onLoginClick: () => void;
}

export function GuestWarningBanner({ onLoginClick }: Props) {
  return (
    <div className="w-full bg-[var(--color-blueprint-strong)] text-[var(--color-on-blueprint)] px-4 py-2 flex items-center justify-between text-sm shadow-md z-[60] relative">
      <div className="flex items-center gap-2">
        <AlertCircle size={16} />
        <span>
          <strong>Guest Mode:</strong> Please login for full access (it&apos;s free!). You will lose your work if you refresh. Save, Export, and AI features are disabled.
        </span>
      </div>
      <button
        onClick={onLoginClick}
        className="px-3 py-1 bg-white text-[var(--color-blueprint-strong)] font-semibold rounded-md hover:bg-gray-100 transition-colors shadow-sm text-xs"
      >
        Sign In / Sign Up
      </button>
    </div>
  );
}
