"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CircleAlert } from "lucide-react";
import type { Editor } from "tldraw";

import type { PlanMetrics } from "@/features/planner/editor/planMetrics";
import {
  canAdvancePlannerStep,
  evaluatePlannerStepGates,
  getPlannerStepActionLabel,
  getPlannerStepHint,
  nextPlannerStep,
  PLANNER_STEP_LABELS,
  type PlannerStep,
} from "@/features/planner/editor/plannerStep";
import { runPlannerComplianceCheck } from "@/features/planner/lib/compliance";

type WorkflowFinding = {
  severity: "critical" | "warning";
  message: string;
};

interface PlannerWorkflowPanelProps {
  editor: Editor | null;
  metrics: PlanMetrics;
  step: PlannerStep;
  onStepChange: (step: PlannerStep) => void;
  onOpenExport: () => void;
}

function toWorkflowFinding(message: string): WorkflowFinding {
  return {
    severity: message.startsWith("CRITICAL:") ? "critical" : "warning",
    message,
  };
}

function FindingRow({ finding }: { finding: WorkflowFinding }) {
  const Icon = finding.severity === "critical" ? CircleAlert : AlertTriangle;
  return (
    <li
      className={`pw-workflow-finding pw-workflow-finding--${finding.severity}`}
      role="listitem"
    >
      <Icon size={14} aria-hidden />
      <span>{finding.message}</span>
    </li>
  );
}

export function PlannerWorkflowPanel({
  editor,
  metrics,
  step,
  onStepChange,
  onOpenExport,
}: PlannerWorkflowPanelProps) {
  const [findings, setFindings] = useState<WorkflowFinding[]>([]);

  useEffect(() => {
    if (!editor) return;

    const sync = () => {
      const warnings = runPlannerComplianceCheck(editor, editor.getCurrentPageShapes());
      setFindings(warnings.map(toWorkflowFinding));
    };

    sync();
    const cleanup = editor.store.listen(sync, { scope: "document" });
    return () => cleanup();
  }, [editor]);

  const gates = evaluatePlannerStepGates(editor, metrics);

  const hint = getPlannerStepHint(step, gates);
  const actionLabel = getPlannerStepActionLabel(step);
  const canAdvance = canAdvancePlannerStep(step, gates);
  const criticalCount = findings.filter((finding) => finding.severity === "critical").length;

  const handlePrimary = () => {
    if (step === "review") {
      if (gates.canOpenExport) onOpenExport();
      return;
    }

    const next = nextPlannerStep(step);
    if (!next || !canAdvance) return;
    onStepChange(next);
  };

  return (
    <section className="pw-workflow-panel" aria-label="Workflow and compliance">
      <p className="pw-workflow-head">
        <span className="pw-workflow-kicker">
          <span>Current step</span>
          <strong className="pw-workflow-step">{PLANNER_STEP_LABELS[step]}</strong>
        </span>
      </p>
      <p className="pw-workflow-hint">{hint}</p>

      {findings.length > 0 ? (
        <ul className="pw-workflow-findings" role="list" aria-live="polite">
          {findings.map((finding) => (
            <FindingRow key={finding.message} finding={finding} />
          ))}
        </ul>
      ) : (
        <p className="pw-workflow-ok">No overlap or clearance issues detected.</p>
      )}

      <button
        type="button"
        className="pw-workflow-cta"
        disabled={!canAdvance || (step === "review" && criticalCount > 0)}
        onClick={handlePrimary}
      >
        {actionLabel}
      </button>

      {step === "review" && criticalCount > 0 ? (
        <p className="pw-workflow-blocker">Resolve overlapping furniture before export.</p>
      ) : null}
    </section>
  );
}
