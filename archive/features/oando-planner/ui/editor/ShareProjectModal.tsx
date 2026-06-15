"use client";

import React from "react";

interface ShareProjectModalProps {
  open: boolean;
  shareURL: string;
  shareCopied: boolean;
  dialogRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onCopy: () => void;
}

export function ShareProjectModal({
  open,
  shareURL,
  shareCopied,
  dialogRef,
  onClose,
  onCopy,
}: ShareProjectModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div ref={dialogRef} className="relative bg-[var(--surface-inverse)] backdrop-blur-xl rounded-xl shadow-2xl w-full max-w-md mx-4 border border-[var(--color-accent)] animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-accent)]">
          <div>
            <h2 id="share-modal-title" className="text-white text-[15px] font-semibold">Share Project</h2>
            <p className="text-[var(--color-dark-midnight-blue-100)] text-[11px] mt-0.5">Share a read-only view of your project</p>
          </div>
          <button onClick={onClose} aria-label="Close share dialog" className="w-8 h-8 rounded-lg bg-white/[0.04] text-[var(--color-dark-midnight-blue-100)] hover:text-[var(--text-inverse)] flex items-center justify-center text-xl leading-none">&times;</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-[var(--overlay-inverse-35)] rounded-lg p-3 border border-white/[0.06]">
            <p className="text-[10px] text-[var(--color-accent)] mb-1.5 uppercase tracking-wider font-medium">Share URL</p>
            <p className="text-[11px] text-[var(--color-accent)] break-all font-mono leading-relaxed">{shareURL}</p>
          </div>
          <div className="bg-[var(--color-accent)] border border-[var(--color-accent)] rounded-lg p-3">
            <p className="text-[11px] text-[var(--color-accent)]">The project data is encoded directly in the URL. Anyone with this link can view the floor plan in read-only mode.</p>
          </div>
          <button
            onClick={onCopy}
            className={`w-full py-2.5 rounded-lg text-[13px] font-semibold transition-all ${shareCopied ? "bg-emerald-600 text-white" : "bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-hover)] hover:from-[var(--color-accent-hover)] hover:to-[var(--color-accent)] text-white shadow-md"}`}
          >
            {shareCopied ? "✓ Copied to Clipboard" : "Copy Share Link"}
          </button>
        </div>
      </div>
    </div>
  );
}
