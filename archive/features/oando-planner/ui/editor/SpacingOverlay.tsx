"use client";
import { useMemo } from "react";
import type { FurnitureItem, Point } from "@/features/oando-planner/data/plannerStore";
import { usePlannerStore } from "@/features/oando-planner/data/plannerStore";

const SPACING_STANDARDS = {
  deskToDesk: { min: 120, recommended: 150, label: "Desk-to-Desk" },
  aisle: { min: 90, recommended: 120, label: "Aisle Width" },
  wheelchair: { min: 150, recommended: 180, label: "Wheelchair Clearance" },
  mainCorridor: { min: 150, recommended: 200, label: "Main Corridor" },
};

type SpacingRule = "deskToDesk" | "aisle" | "wheelchair" | "mainCorridor";

const DESK_SHAPES = ["desk", "desk-l"];
const CHAIR_SHAPES = ["office-chair", "dining-chair"];
const LARGE_FURNITURE = ["sofa", "sofa-2", "sofa-3", "bookcase", "storage-shelf", "filing-cabinet", "dining-table-rect", "dining-table-round"];

function edgeDistance(a: FurnitureItem, b: FurnitureItem): number {
  const aLeft = a.x - a.width / 2;
  const aRight = a.x + a.width / 2;
  const aTop = a.y - a.height / 2;
  const aBottom = a.y + a.height / 2;
  const bLeft = b.x - b.width / 2;
  const bRight = b.x + b.width / 2;
  const bTop = b.y - b.height / 2;
  const bBottom = b.y + b.height / 2;

  const dx = Math.max(0, Math.max(aLeft - bRight, bLeft - aRight));
  const dy = Math.max(0, Math.max(aTop - bBottom, bTop - aBottom));
  return Math.sqrt(dx * dx + dy * dy);
}

const WHEELCHAIR_ITEMS = ["sofa", "sofa-2", "sofa-3", "dining-table-rect", "dining-table-round"];

function classifyPair(a: FurnitureItem, b: FurnitureItem): SpacingRule {
  const aIsDesk = DESK_SHAPES.includes(a.shape);
  const bIsDesk = DESK_SHAPES.includes(b.shape);
  if (aIsDesk && bIsDesk) return "deskToDesk";

  const aIsWheelchair = WHEELCHAIR_ITEMS.includes(a.shape);
  const bIsWheelchair = WHEELCHAIR_ITEMS.includes(b.shape);
  if ((aIsWheelchair || bIsWheelchair) && (aIsDesk || bIsDesk || aIsWheelchair || bIsWheelchair)) return "wheelchair";

  const aIsLarge = LARGE_FURNITURE.includes(a.shape);
  const bIsLarge = LARGE_FURNITURE.includes(b.shape);
  if ((aIsLarge || bIsLarge) && (aIsDesk || bIsDesk)) return "mainCorridor";

  const aIsChair = CHAIR_SHAPES.includes(a.shape);
  const bIsChair = CHAIR_SHAPES.includes(b.shape);
  if ((aIsChair && bIsChair) || (aIsChair && bIsDesk) || (aIsDesk && bIsChair)) return "aisle";

  return "aisle";
}

function getStatusForRule(dist: number, rule: SpacingRule): "compliant" | "tight" | "violation" {
  const std = SPACING_STANDARDS[rule];
  if (dist >= std.recommended) return "compliant";
  if (dist >= std.min) return "tight";
  return "violation";
}

interface SpacingLine {
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  from: Point;
  to: Point;
  distance: number;
  status: "compliant" | "tight" | "violation";
  label: string;
  rule: SpacingRule;
}

interface SpacingRecommendation {
  id: string;
  priority: "high" | "medium";
  headline: string;
  detail: string;
}

const STATUS_COLORS: Record<string, string> = {
  compliant: "var(--color-raw-success)",
  tight: "var(--color-raw-warning)",
  violation: "var(--color-raw-danger)",
};

interface Props {
  show: boolean;
}

function analyzeSpacing(furniture: FurnitureItem[]) {
  const workItems = furniture.filter((f) =>
    DESK_SHAPES.includes(f.shape) ||
    CHAIR_SHAPES.includes(f.shape) ||
    LARGE_FURNITURE.includes(f.shape)
  );
  const lines: SpacingLine[] = [];

  for (let i = 0; i < workItems.length; i++) {
    for (let j = i + 1; j < workItems.length; j++) {
      const dist = edgeDistance(workItems[i], workItems[j]);
      if (dist > 300) continue;
      if (dist < 5) continue;

      const rule = classifyPair(workItems[i], workItems[j]);
      const status = getStatusForRule(dist, rule);

      lines.push({
        fromId: workItems[i].id,
        toId: workItems[j].id,
        fromName: workItems[i].name,
        toName: workItems[j].name,
        from: { x: workItems[i].x, y: workItems[i].y },
        to: { x: workItems[j].x, y: workItems[j].y },
        distance: Math.round(dist),
        status,
        label: `${Math.round(dist)}cm`,
        rule,
      });
    }
  }

  const ruleBreakdown: Record<SpacingRule, { violations: number; tight: number; compliant: number }> = {
    deskToDesk: { violations: 0, tight: 0, compliant: 0 },
    aisle: { violations: 0, tight: 0, compliant: 0 },
    wheelchair: { violations: 0, tight: 0, compliant: 0 },
    mainCorridor: { violations: 0, tight: 0, compliant: 0 },
  };

  for (const l of lines) {
    if (l.status === "violation") ruleBreakdown[l.rule].violations++;
    else if (l.status === "tight") ruleBreakdown[l.rule].tight++;
    else ruleBreakdown[l.rule].compliant++;
  }

  const violations = lines.filter((l) => l.status === "violation").length;
  const tight = lines.filter((l) => l.status === "tight").length;
  const compliant = lines.filter((l) => l.status === "compliant").length;

  return { lines, violations, tight, compliant, total: lines.length, ruleBreakdown };
}

function getSpacingRecommendations(lines: SpacingLine[]): SpacingRecommendation[] {
  return [...lines]
    .filter((line) => line.status !== "compliant")
    .sort((a, b) => {
      const severityA = a.status === "violation" ? 2 : 1;
      const severityB = b.status === "violation" ? 2 : 1;
      if (severityA !== severityB) return severityB - severityA;
      return a.distance - b.distance;
    })
    .slice(0, 4)
    .map((line) => {
      const standard = SPACING_STANDARDS[line.rule];
      return {
        id: `${line.fromId}:${line.toId}:${line.rule}`,
        priority: line.status === "violation" ? "high" : "medium",
        headline: `${line.fromName} and ${line.toName}`,
        detail:
          line.status === "violation"
            ? `${standard.label} is ${line.distance}cm. Increase to at least ${standard.min}cm.`
            : `${standard.label} is ${line.distance}cm. Recommended target is ${standard.recommended}cm.`,
      };
    });
}

export function useSpacingAnalysis() {
  const furniture = usePlannerStore((s) => s.furniture);
  return useMemo(() => analyzeSpacing(furniture), [furniture]);
}

export function SpacingOverlayInfo({ show }: Props) {
  const analysis = useSpacingAnalysis();
  const recommendations = useMemo(
    () => getSpacingRecommendations(analysis.lines),
    [analysis.lines],
  );

  if (!show) return null;

  return (
    <div className="absolute top-3 left-3 bg-[var(--surface-inverse)]/90 backdrop-blur-sm rounded-lg p-3 border border-white/10 z-20 min-w-[220px]">
      <h3 className="text-white text-[12px] font-semibold mb-2">Spacing Compliance</h3>
      <p className="text-[10px] text-white/40 mb-2">NBC India Standards</p>
      {analysis.total === 0 && (
        <div className="mb-3 rounded-lg border border-dashed border-white/10 px-2.5 py-2 text-[10px] text-white/35">
          Add desks, chairs, or larger furniture to see spacing guidance here.
        </div>
      )}
      <div className="space-y-1.5">
        {(Object.entries(SPACING_STANDARDS) as [SpacingRule, typeof SPACING_STANDARDS.deskToDesk][]).map(([key, std]) => {
          const rb = analysis.ruleBreakdown[key];
          const ruleTotal = rb.violations + rb.tight + rb.compliant;
          const statusColor = rb.violations > 0 ? "var(--color-raw-danger)" : rb.tight > 0 ? "var(--color-raw-warning)" : "var(--color-raw-success)";
          return (
            <div key={key} className="text-[10px]">
              <div className="flex items-center justify-between">
                <span className="text-white/50">{std.label}</span>
                <span className="text-white/70">{std.min}–{std.recommended}cm</span>
              </div>
              {ruleTotal > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                  <span className="text-white/40">
                    {rb.compliant}✓ {rb.tight}⚠ {rb.violations}✗
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {recommendations.length > 0 && (
        <div className="mt-3 pt-2 border-t border-white/10">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-white/35">Top Fixes</p>
          <div className="space-y-2">
            {recommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        recommendation.priority === "high"
                          ? "var(--color-raw-danger)"
                          : "var(--color-raw-warning)",
                    }}
                  />
                  <p className="text-[10px] text-white/75">{recommendation.headline}</p>
                </div>
                <p className="mt-1 text-[10px] text-white/40">{recommendation.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-3 pt-2 border-t border-white/10 space-y-1">
        <div className="flex items-center gap-2 text-[10px]">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-raw-success)" }} />
          <span className="text-white/50">Compliant:</span>
          <span className="text-white/80 ml-auto">{analysis.compliant}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-raw-warning)" }} />
          <span className="text-white/50">Tight:</span>
          <span className="text-white/80 ml-auto">{analysis.tight}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-raw-danger)" }} />
          <span className="text-white/50">Violation:</span>
          <span className="text-white/80 ml-auto">{analysis.violations}</span>
        </div>
      </div>
    </div>
  );
}

export function getSpacingLines(furniture: FurnitureItem[]) {
  return analyzeSpacing(furniture).lines;
}

export function getSpacingRecommendationsForFurniture(furniture: FurnitureItem[]) {
  return getSpacingRecommendations(analyzeSpacing(furniture).lines);
}

export { STATUS_COLORS, SPACING_STANDARDS };
export type { SpacingLine, SpacingRecommendation };
