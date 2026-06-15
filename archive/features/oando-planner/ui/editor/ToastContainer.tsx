"use client";
import type { ToastType } from "@/features/oando-planner/data/toastStore";
import { useToastStore } from "@/features/oando-planner/data/toastStore";

const typeStyles: Record<ToastType, string> = {
  success: "bg-emerald-600/90 border-emerald-500/30",
  error: "bg-red-600/90 border-red-500/30",
  info: "bg-blue-600/90 border-blue-500/30",
  warning: "bg-amber-600/90 border-amber-500/30",
};

const typeIcons: Record<ToastType, string> = {
  success: "\u2713",
  error: "\u2717",
  info: "i",
  warning: "!",
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-lg border shadow-lg cursor-pointer text-white text-sm animate-slide-in ${typeStyles[toast.type]}`}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">
            {typeIcons[toast.type]}
          </span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
