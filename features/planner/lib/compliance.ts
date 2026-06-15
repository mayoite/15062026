"use client";

import type { Editor } from "tldraw";

import { getShapeMeta } from "./measurements";

type PlannerShape = ReturnType<Editor["getCurrentPageShapes"]>[number];

const PAGE_UNIT_MM = 10;
const ADA_CLEARANCE_MM = 900;
const ADA_CLEARANCE_CANVAS_UNITS = ADA_CLEARANCE_MM / PAGE_UNIT_MM; // 90

export function runPlannerComplianceCheck(editor: Editor, shapes: PlannerShape[]) {
  const warnings: string[] = [];
  const plannerShapes = shapes.filter((shape) => getShapeMeta(shape.meta).isPlannerItem);
  let overlapCount = 0;
  let tightClearanceCount = 0;

  for (let index = 0; index < plannerShapes.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < plannerShapes.length; nextIndex += 1) {
      const boundsA = editor.getShapePageBounds(plannerShapes[index]);
      const boundsB = editor.getShapePageBounds(plannerShapes[nextIndex]);

      if (!boundsA || !boundsB) continue;

      const isOverlapping = !(
        boundsA.maxX < boundsB.minX ||
        boundsA.minX > boundsB.maxX ||
        boundsA.maxY < boundsB.minY ||
        boundsA.minY > boundsB.maxY
      );

      if (isOverlapping) {
        overlapCount += 1;
        continue;
      }

      const clearanceX = Math.max(0, Math.max(boundsA.minX - boundsB.maxX, boundsB.minX - boundsA.maxX));
      const clearanceY = Math.max(0, Math.max(boundsA.minY - boundsB.maxY, boundsB.minY - boundsA.maxY));
      const distance = Math.sqrt(clearanceX * clearanceX + clearanceY * clearanceY);

      if (distance > 0 && distance < ADA_CLEARANCE_CANVAS_UNITS) {
        tightClearanceCount += 1;
      }
    }
  }

  if (overlapCount > 0) {
    warnings.push(`CRITICAL: ${overlapCount} workstation(s) are severely overlapping.`);
  }
  if (tightClearanceCount > 0) {
    warnings.push(
      `COMPLIANCE WARNING: ${tightClearanceCount} module boundary clearances are under the strict ${ADA_CLEARANCE_MM}mm ADA minimum.`
    );
  }

  return warnings;
}
