import { z } from "zod";
import type { PlannerDocument } from "./plannerDocument";

const planner3dSceneRoomSchema = z.object({
  widthMm: z.number().positive(),
  depthMm: z.number().positive(),
  wallHeightMm: z.number().positive(),
  wallThicknessMm: z.number().positive(),
  floorThicknessMm: z.number().positive(),
});

const planner3dScenePositionSchema = z.object({
  xMm: z.number().finite(),
  yMm: z.number().finite(),
});

const planner3dSceneSizeSchema = z.object({
  widthMm: z.number().positive(),
  depthMm: z.number().positive(),
  heightMm: z.number().positive(),
});

const planner3dSceneItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  centerMm: planner3dScenePositionSchema,
  sizeMm: planner3dSceneSizeSchema,
  rotationDeg: z.number().finite(),
  color: z.string().min(1).optional(),
});

export const planner3dSceneDocumentSchema = z.object({
  type: z.literal("cad-suite-planner-3d-scene"),
  version: z.literal(1),
  id: z.string().min(1),
  title: z.string().min(1),
  note: z.string().min(1).optional(),
  room: planner3dSceneRoomSchema,
  items: z.array(planner3dSceneItemSchema),
});

export type Planner3DSceneRoom = z.infer<typeof planner3dSceneRoomSchema>;
export type Planner3DScenePosition = z.infer<typeof planner3dScenePositionSchema>;
export type Planner3DSceneSize = z.infer<typeof planner3dSceneSizeSchema>;
export type Planner3DSceneItem = z.infer<typeof planner3dSceneItemSchema>;
export type Planner3DSceneDocument = z.infer<typeof planner3dSceneDocumentSchema>;
export type Planner3DSceneWarningSeverity = "warning" | "info";

export interface Planner3DSceneWarning {
  code: string;
  severity: Planner3DSceneWarningSeverity;
  message: string;
  itemId?: string;
}

export interface Planner3DSceneWarningsResult {
  warnings: Planner3DSceneWarning[];
}

export function validatePlanner3DSceneDocument(
  value: unknown,
): Planner3DSceneDocument {
  return planner3dSceneDocumentSchema.parse(value);
}

export function collectPlanner3DSceneWarnings(
  document: PlannerDocument,
): Planner3DSceneWarningsResult {
  const warnings: Planner3DSceneWarning[] = [];
  const sceneJson = document.sceneJson;
  const scene =
    sceneJson && typeof sceneJson === "object" && !Array.isArray(sceneJson)
      ? (sceneJson as Record<string, unknown>).plannerScene ??
        (sceneJson as Record<string, unknown>).planner3dScene ??
        sceneJson
      : null;

  if (!scene || typeof scene !== "object" || Array.isArray(scene)) {
    warnings.push({
      code: "planner-3d-scene-missing",
      severity: "info",
      message: "The document does not contain a mapped 3D scene envelope yet.",
    });
    return { warnings };
  }

  const candidates = Array.isArray((scene as Record<string, unknown>).items)
    ? ((scene as Record<string, unknown>).items as unknown[])
    : [];

  if (candidates.length === 0) {
    warnings.push({
      code: "planner-3d-scene-empty",
      severity: "info",
      message: "The mapped 3D scene does not contain any placed items yet.",
    });
    return { warnings };
  }

  candidates.forEach((candidate, index) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      warnings.push({
        code: "planner-3d-item-unsupported",
        severity: "warning",
        message: `3D item ${index + 1} is unsupported and was normalized for preview.`,
      });
      return;
    }

    const item = candidate as Record<string, unknown>;
    if (typeof item.id !== "string" || item.id.trim().length === 0) {
      warnings.push({
        code: "planner-3d-item-missing-id",
        severity: "warning",
        message: `3D item ${index + 1} is missing an id and was normalized for preview.`,
      });
    }
    if (typeof item.name !== "string" || item.name.trim().length === 0) {
      warnings.push({
        code: "planner-3d-item-missing-name",
        severity: "warning",
        message: `3D item ${index + 1} is missing a name and was normalized for preview.`,
      });
    }
    if (typeof item.category !== "string" || item.category.trim().length === 0) {
      warnings.push({
        code: "planner-3d-item-missing-category",
        severity: "warning",
        message: `3D item ${index + 1} is missing a category and was normalized for preview.`,
      });
    }
  });

  return { warnings };
}
