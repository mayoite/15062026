"use client";
/**
 * Compliance Violation Overlay - Renders violations as overlays with suggested fixes
 * Displays compliance violations on the planner canvas with visual indicators and details
 */

import React, { useState } from "react";
import type { ComplianceViolation, ComplianceCheckResult } from "../lib/complianceEngine";

export interface ComplianceOverlayProps {
  result: ComplianceCheckResult;
  visible: boolean;
  onDismiss?: () => void;
  onApplyFix?: (violation: ComplianceViolation) => void;
  onSelectShape?: (shapeId: string) => void;
}

export function ComplianceViolationOverlay({
  result,
  visible,
  onDismiss,
  onApplyFix,
  onSelectShape,
}: ComplianceOverlayProps) {
  const [selectedViolation, setSelectedViolation] = useState<ComplianceViolation | null>(null);
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "info">("all");

  if (!visible) return null;

  const filteredViolations = result.violations.filter(v => {
    if (filter === "all") return true;
    return v.severity === filter;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500";
      case "warning":
        return "bg-amber-500";
      case "info":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getSeverityBorderColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-red-500";
      case "warning":
        return "border-amber-500";
      case "info":
        return "border-blue-500";
      default:
        return "border-gray-500";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return "⚠";
      case "warning":
        return "⚡";
      case "info":
        return "ℹ";
      default:
        return "•";
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Violation markers on canvas */}
      {filteredViolations.map((violation, index) => (
        <div
          key={`${violation.ruleId}-${index}`}
          className={`absolute w-8 h-8 rounded-full ${getSeverityColor(violation.severity)} opacity-75 cursor-pointer pointer-events-auto flex items-center justify-center text-white text-sm font-bold animate-pulse`}
          style={{
            left: violation.location ? `${violation.location.x}px` : "50%",
            top: violation.location ? `${violation.location.y}px` : "50%",
            transform: "translate(-50%, -50%)",
          }}
          onClick={() => setSelectedViolation(violation)}
          title={violation.message}
        >
          {index + 1}
        </div>
      ))}

      {/* Violation panel */}
      <div className="absolute top-4 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 pointer-events-auto">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Compliance Check
            </h3>
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Score */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  result.score >= 80 ? "bg-green-500" : 
                  result.score >= 50 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${result.score}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {result.score}%
            </span>
          </div>

          {/* Summary */}
          <div className="mt-2 text-sm text-gray-600">
            {result.passed ? (
              <span className="text-green-600">✓ All critical checks passed</span>
            ) : (
              <span className="text-red-600">
                ✗ {result.violations.filter(v => v.severity === "critical").length} critical issue(s)
              </span>
            )}
            <span className="mx-2">•</span>
            <span>{result.violations.length} total issue(s)</span>
          </div>
        </div>

        {/* Filters */}
        <div className="p-3 border-b border-gray-200 flex gap-2">
          {(["all", "critical", "warning", "info"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Violations list */}
        <div className="max-h-96 overflow-y-auto p-3">
          {filteredViolations.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No violations found
            </div>
          ) : (
            <div className="space-y-2">
              {filteredViolations.map((violation, index) => (
                <div
                  key={`${violation.ruleId}-${index}`}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedViolation === violation
                      ? `${getSeverityBorderColor(violation.severity)} bg-gray-50`
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedViolation(violation)}
                >
                  <div className="flex items-start gap-2">
                    <span className={`text-xs ${getSeverityColor(violation.severity)} text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      {getSeverityIcon(violation.severity)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">
                        {violation.message}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {violation.details}
                      </div>
                      {violation.standardRef && (
                        <div className="text-xs text-gray-500 mt-1">
                          Standard: {violation.standardRef}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Affected shapes */}
                  {violation.affectedShapeIds.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">
                        Affected items ({violation.affectedShapeIds.length}):
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {violation.affectedShapeIds.slice(0, 5).map((id) => (
                          <button
                            key={id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectShape?.(id);
                            }}
                            className="text-xs bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200 transition-colors"
                          >
                            {id.slice(0, 8)}...
                          </button>
                        ))}
                        {violation.affectedShapeIds.length > 5 && (
                          <span className="text-xs text-gray-500">
                            +{violation.affectedShapeIds.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Suggested fix */}
                  {violation.suggestedFix && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">
                        Suggested fix:
                      </div>
                      <div className="text-xs text-gray-700">
                        {violation.suggestedFix}
                      </div>
                      {onApplyFix && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onApplyFix(violation);
                          }}
                          className="mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                        >
                          Apply Fix
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="text-xs text-gray-500">
            Checked at: {new Date(result.checkedAt).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {result.passedChecks}/{result.totalChecks} checks passed
          </div>
        </div>
      </div>

      {/* Selected violation detail modal */}
      {selectedViolation && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 pointer-events-auto"
          onClick={() => setSelectedViolation(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-4 rounded-t-lg ${getSeverityColor(selectedViolation.severity)} text-white`}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getSeverityIcon(selectedViolation.severity)}</span>
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedViolation.severity.toUpperCase()} Violation
                  </h3>
                  <p className="text-sm opacity-90">
                    {selectedViolation.ruleId}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-1">
                  Issue
                </h4>
                <p className="text-gray-700">
                  {selectedViolation.message}
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-1">
                  Details
                </h4>
                <p className="text-gray-700">
                  {selectedViolation.details}
                </p>
              </div>

              {selectedViolation.standardRef && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-1">
                    Standard Reference
                  </h4>
                  <p className="text-gray-700">
                    {selectedViolation.standardRef}
                  </p>
                </div>
              )}

              {selectedViolation.suggestedFix && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-1">
                    Suggested Fix
                  </h4>
                  <p className="text-gray-700">
                    {selectedViolation.suggestedFix}
                  </p>
                </div>
              )}

              {selectedViolation.affectedShapeIds.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-1">
                    Affected Items
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedViolation.affectedShapeIds.map((id) => (
                      <button
                        key={id}
                        onClick={() => {
                          onSelectShape?.(id);
                          setSelectedViolation(null);
                        }}
                        className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        {id}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setSelectedViolation(null)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                {selectedViolation.suggestedFix && onApplyFix && (
                  <button
                    onClick={() => {
                      onApplyFix(selectedViolation);
                      setSelectedViolation(null);
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                  >
                    Apply Fix
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compliance summary badge component
 */
export interface ComplianceBadgeProps {
  result: ComplianceCheckResult;
  onClick?: () => void;
}

export function ComplianceBadge({ result, onClick }: ComplianceBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  const criticalCount = result.violations.filter(v => v.severity === "critical").length;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-white ${getScoreColor(result.score)} hover:opacity-90 transition-opacity`}
    >
      <span>✓</span>
      <span>{result.score}%</span>
      {criticalCount > 0 && (
        <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
          {criticalCount} critical
        </span>
      )}
    </button>
  );
}