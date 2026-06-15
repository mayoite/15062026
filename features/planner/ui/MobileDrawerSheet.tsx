"use client";

import { Drawer } from "vaul";
import type { ReactNode } from "react";

interface MobileDrawerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  trigger: ReactNode;
  children: ReactNode;
}

/* ─────────────────────────────────────────────
   MobileDrawerSheet
   A bottom-sheet drawer for mobile viewports.
   Uses vaul for native iOS-quality swipe-to-dismiss.
   Renders only on mobile — desktop uses WorkspacePanel.
   ───────────────────────────────────────────── */
export function MobileDrawerSheet({
  open,
  onOpenChange,
  title,
  trigger,
  children,
}: MobileDrawerSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-sheet bg-[color:rgba(7,13,18,0.38)] backdrop-blur-sm" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-sheet flex flex-col bg-panel border-t border-theme-soft rounded-t-[1.6rem] shadow-theme-float backdrop-blur-xl"
          style={{ maxHeight: "85svh" }}
          aria-label={title}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2 shrink-0">
            <div className="w-10 h-1 rounded-full bg-[color:var(--planner-border-strong)] opacity-70" aria-hidden="true" />
          </div>

          {/* Header */}
          <div className="px-4 pb-3 border-b border-theme-soft shrink-0">
            <Drawer.Title className="typ-caption-lg font-bold text-muted uppercase tracking-widest">
              {title}
            </Drawer.Title>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 overscroll-contain">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
