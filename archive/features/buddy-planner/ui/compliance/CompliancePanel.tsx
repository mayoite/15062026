/**
 * CompliancePanel - Side panel showing pass/fail compliance checks
 *
 * Displays results from the compliance engine with
 * color-coded status, affected element highlighting.
 */

"use client";

import { useMemo } from "react";
import { CheckCircle, AlertTriangle, XCircle, Shield } from "lucide-react";
import { type ComplianceResult, type ComplianceCheckInput, runComplianceChecks, getComplianceSummary } from "../../logic/complianceEngine";

interface CompliancePanelProps {
  input: ComplianceCheckInput;
  onHighlightShapes?: (shapeIds: string[]) => void;
}

export function CompliancePanel({ input, onHighlightShapes }: CompliancePanelProps) {
  const results = useMemo(() => runComplianceChecks(input), [input]);
  const summary = useMemo(() => getComplianceSummary(results), [results]);

  return (
    <div className="w-64 border-l flex flex-col h-full bg-white" style={{ borderColor: "var(--border-soft, #e5e5e5)" }}>
      {/* Header */}
      <div className="p-3 border-b" style={{ borderColor: "var(--border-soft, #e5e5e5)" }}>
        <div className="flex items-center gap-2">
          <Shield size={14} style={{ color: summary.isCompliant ? "#10b981" : "#ef4444" }} />
          <h3 className="text-xs font-semibold" style={{ color: "var(--text-strong, #333)" }}>
            Compliance Check
          </h3>
        </div>

        {/* Summary badges */}
        <div className="flex gap-2 mt-2">
          <Badge color="#10b981" count={summary.pass} label="Pass" />
          <Badge color="#f59e0b" count={summary.warn} label="Warn" />
          <Badge color="#ef4444" count={summary.fail} label="Fail" />
        </div>
      </div>

      {/* Results list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle size={24} className="mb-2" style={{ color: "#10b981" }} />
            <p className="text-xs font-medium" style={{ color: "#10b981" }}>All checks passed</p>
            <p className="text-[10px] mt-1" style={{ color: "var(--text-muted, #999)" }}>
              No compliance issues found
            </p>
          </div>
        )}

        {results.map((result, i) => (
          <ComplianceResultItem
            key={`${result.rule.id}-${i}`}
            result={result}
            onHighlight={() => onHighlightShapes?.(result.affectedShapeIds)}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="p-2 border-t text-[9px] space-y-0.5" style={{ borderColor: "var(--border-soft, #e5e5e5)", color: "var(--text-muted, #999)" }}>
        <p>• ADA aisle: ≥900mm between obstacles</p>
        <p>• Desk spacing: ≥1200mm face-to-face</p>
        <p>• Zone capacity: max 80% fill</p>
        <p>• Utilization: max 70% floor area</p>
      </div>
    </div>
  );
}

function ComplianceResultItem({ result, onHighlight }: { result: ComplianceResult; onHighlight: () => void }) {
  const icon = result.level === "fail"
    ? <XCircle size={12} style={{ color: "#ef4444" }} />
    : result.level === "warn"
      ? <AlertTriangle size={12} style={{ color: "#f59e0b" }} />
      : <CheckCircle size={12} style={{ color: "#10b981" }} />;

  const bgColor = result.level === "fail"
    ? "rgba(239,68,68,0.05)"
    : result.level === "warn"
      ? "rgba(245,158,11,0.05)"
      : "rgba(16,185,129,0.05)";

  return (
    <button
      onClick={onHighlight}
      className="w-full text-left p-2 rounded-md border transition-colors hover:shadow-sm"
      style={{
        borderColor: "var(--border-soft, #eee)",
        background: bgColor,
      }}
      aria-label={`${result.rule.name}: ${result.message}`}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex-shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold truncate" style={{ color: "var(--text-strong, #333)" }}>
            {result.rule.name}
          </p>
          <p className="text-[9px] mt-0.5 leading-tight" style={{ color: "var(--text-muted, #666)" }}>
            {result.message}
          </p>
          {result.measurement !== undefined && (
            <p className="text-[9px] mt-0.5" style={{ color: "var(--text-muted, #999)" }}>
              Measured: {result.measurement}{result.rule.category === "capacity" ? "%" : "mm"}
              {result.threshold ? ` / Limit: ${result.threshold}${result.rule.category === "capacity" ? "%" : "mm"}` : ""}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

function Badge({ color, count, label }: { color: string; count: number; label: string }) {
  return (
    <span
      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{ background: `${color}15`, color }}
    >
      {count} {label}
    </span>
  );
}
