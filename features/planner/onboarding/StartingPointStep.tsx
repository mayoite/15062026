import { PencilLine } from "lucide-react";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";
import { markProjectSetupCompleteInStorage } from "./projectSetup";

type StartingPointStepProps = {
  guestMode?: boolean;
  planId?: string;
  onComplete: (mode: "template") => void;
};

export function StartingPointStep({ guestMode = false, planId, onComplete }: StartingPointStepProps) {
  const metadata = usePlannerWorkspaceStore((s) => s.projectMetadata);

  const handleModeSelect = (mode: "template") => {
    onComplete(mode);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="typ-h2 text-[color:var(--text-strong)]">Let's get started</h1>
          <p className="typ-body text-[color:var(--text-muted)] max-w-md mx-auto">
            Choose how you want to build out your space. 
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 max-w-lg mx-auto">
          <button
            onClick={() => handleModeSelect("template")}
            className="pw-starting-point-btn"
          >
            <div className="pw-starting-point-icon">
              <PencilLine className="h-6 w-6 text-indigo-500" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-[color:var(--text-strong)]">Start from Scratch</div>
              <div className="text-xs text-[color:var(--text-muted)] leading-tight mt-1">
                We'll generate a basic room outline based on your {metadata?.floorAreaSqFt || 2000} SqFt size. You can adjust the walls later.
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
