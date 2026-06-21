"use client";
import { AlertTriangle, CircleAlert } from "lucide-react";
import { useMemo } from "react";


import type { PlanMetrics } from "@/features/planner/editor/planMetrics";
import {
  canAdvancePlannerStep,
  evaluatePlannerStepGates,
  getPlannerStepActionLabel,
  getPlannerStepHint,
  nextPlannerStep,
  previousPlannerStep,
  PLANNER_STEP_LABELS,
  type PlannerStep,
} from "@/features/planner/editor/plannerStep";
import { runPlannerComplianceCheck } from "@/features/planner/lib/compliance";

type WorkflowFinding = {
  severity: "critical" | "warning";
  message: string;
};

interface PlannerWorkflowPanelProps {
  editor?: null;
  metrics: PlanMetrics;
  step: PlannerStep;
  onStepChange: (step: PlannerStep) => void;
  onOpenExport: () => void;
}

function toWorkflowFinding(message: string): WorkflowFinding {
  const severity = message.startsWith("CRITICAL:") ? "critical" : "warning";
  const text = message
    .replace(/^CRITICAL:\s*/i, "")
    .replace(/^COMPLIANCE WARNING:\s*/i, "")
    .trim();

  return { severity, message: text };
}

function FindingRow({ finding }: { finding: WorkflowFinding }) {
  const Icon = finding.severity === "critical" ? CircleAlert : AlertTriangle;
  return (
    <li
      className={`pw-workflow-finding pw-workflow-finding--${finding.severity}`}
      role="listitem"
    >
      <span className="pw-workflow-finding__icon" aria-hidden>
        <Icon size={14} />
      </span>
      <span className="pw-workflow-finding__text">{finding.message}</span>
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
  const findings = useMemo(() => {
    void metrics.furnitureCount;
    void metrics.shapeCount;
    void metrics.wallCount;
    return runPlannerComplianceCheck(editor ?? null, []).map(toWorkflowFinding);
  }, [editor, metrics.furnitureCount, metrics.shapeCount, metrics.wallCount]);

  const gates = evaluatePlannerStepGates(null, metrics);

  const hint = getPlannerStepHint(step, gates);
  const actionLabel = getPlannerStepActionLabel(step);
  const canAdvance = canAdvancePlannerStep(step, gates);
  const criticalCount = findings.filter((finding) => finding.severity === "critical").length;
  const warningCount = findings.length - criticalCount;
  const previous = previousPlannerStep(step);
  const exportBlocked = step === "review" && criticalCount > 0;
  const primaryDisabled = !canAdvance || exportBlocked;
  const emphasis = step === "draw" ? "muted" : step === "review" ? "prominent" : "soft";

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
    <section
      className="pw-workflow-panel"
      aria-label="Workflow and compliance"
      data-step={step}
      data-emphasis={emphasis}
      data-export-blocked={exportBlocked || undefined}
    >
      <div className="pw-workflow-guidance">
        <p className="pw-workflow-head">
          <span className="pw-workflow-kicker">
            <span>Current step</span>
            <strong className="pw-workflow-step">{PLANNER_STEP_LABELS[step]}</strong>
          </span>
        </p>
        <p className="pw-workflow-hint">{hint}</p>
      </div>

      <div className="pw-workflow-compliance">
        <div className="pw-workflow-compliance-head">
          <p className="pw-workflow-compliance-title">Compliance check</p>
          {findings.length > 0 ? (
            <span
              className="pw-workflow-compliance-badge"
              data-severity={criticalCount > 0 ? "critical" : "warning"}
            >
              {criticalCount > 0
                ? `${criticalCount} critical`
                : `${warningCount} warning${warningCount === 1 ? "" : "s"}`}
            </span>
          ) : (
            <span className="pw-workflow-compliance-badge" data-severity="ok">
              Clear
            </span>
          )}
        </div>

        {findings.length > 0 ? (
          <ul className="pw-workflow-findings" role="list">
            {findings.map((finding, index) => (
              <FindingRow key={`${finding.severity}:${finding.message}:${index}`} finding={finding} />
            ))}
          </ul>
        ) : (
          <p className="pw-workflow-ok">No overlap or clearance issues detected.</p>
        )}
      </div>

      <div
        className="pw-workflow-actions"
        data-role={step === "review" ? "export" : undefined}
      >
        {previous ? (
          <button
            type="button"
            className="pw-workflow-cta pw-workflow-cta--secondary"
            onClick={() => onStepChange(previous)}
          >
            Back to {PLANNER_STEP_LABELS[previous]}
          </button>
        ) : null}
        <button
          type="button"
          className="pw-workflow-cta"
          disabled={primaryDisabled}
          aria-describedby={exportBlocked ? "pw-workflow-blocker" : undefined}
          onClick={handlePrimary}
        >
          {actionLabel}
        </button>
      </div>

      {exportBlocked ? (
        <p id="pw-workflow-blocker" className="pw-workflow-blocker" role="status">
          Resolve overlapping furniture before export.
        </p>
      ) : null}
    </section>
  );
}
