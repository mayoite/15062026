import { z } from "zod";

import type { PlannerManagedProduct } from "./plannerManagedProduct";
import type { PlannerIdentityId } from "./plannerIdentity";

const plannerPlacementPositionSchema = z.object({
  xMm: z.number().finite(),
  yMm: z.number().finite(),
});

const plannerPlacementDimensionsSchema = z.object({
  widthMm: z.number().positive(),
  depthMm: z.number().positive(),
  heightMm: z.number().positive(),
});

const plannerPlacementMetadataSchema = z.object({
  planner: z.enum(["oando", "buddy", "oofpl"]),
  catalogProductId: z.string().min(1),
  catalogSlug: z.string().min(1),
  plannerSourceSlug: z.string().min(1),
  catalogCategory: z.string().min(1),
  name: z.string().min(1),
  shape: z.string().min(1),
  position: plannerPlacementPositionSchema,
  dimensions: plannerPlacementDimensionsSchema,
  rotationDeg: z.number().finite(),
  zIndex: z.number().int(),
  locked: z.boolean(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const plannerPlacementEnvelopeSchema = z.object({
  type: z.literal("cad-suite-planner-placement"),
  version: z.literal(1),
  planner: z.enum(["oando", "buddy", "oofpl"]),
  item: plannerPlacementMetadataSchema,
});

export type PlannerPlacementPosition = z.infer<typeof plannerPlacementPositionSchema>;
export type PlannerPlacementDimensions = z.infer<typeof plannerPlacementDimensionsSchema>;
export type PlannerPlacementMetadata = z.infer<typeof plannerPlacementMetadataSchema>;
export type PlannerPlacementEnvelope = z.infer<typeof plannerPlacementEnvelopeSchema>;

export function validatePlannerPlacementEnvelope(
  value: unknown,
): PlannerPlacementEnvelope {
  return plannerPlacementEnvelopeSchema.parse(value);
}

export function buildPlannerPlacementMetadata(
  planner: PlannerIdentityId,
  product: Pick<
    PlannerManagedProduct,
    "id" | "name" | "category" | "widthMm" | "depthMm" | "heightMm" | "meshType" | "productSlug"
  > & {
    shape?: string;
    plannerSourceSlug: string;
    catalogSlug?: string;
    position: PlannerPlacementPosition;
    rotationDeg?: number;
    zIndex?: number;
    locked?: boolean;
    metadata?: Record<string, unknown>;
  },
): PlannerPlacementMetadata {
  return plannerPlacementMetadataSchema.parse({
    planner,
    catalogProductId: product.id,
    catalogSlug: product.catalogSlug ?? product.productSlug ?? product.id,
    plannerSourceSlug: product.plannerSourceSlug,
    catalogCategory: product.category,
    name: product.name,
    shape: product.shape ?? product.meshType,
    position: product.position,
    dimensions: {
      widthMm: product.widthMm,
      depthMm: product.depthMm,
      heightMm: product.heightMm,
    },
    rotationDeg: product.rotationDeg ?? 0,
    zIndex: product.zIndex ?? 0,
    locked: product.locked ?? false,
    metadata: product.metadata ?? {},
  });
}

export function createPlannerPlacementEnvelope(
  planner: PlannerIdentityId,
  item: PlannerPlacementMetadata,
): PlannerPlacementEnvelope {
  return plannerPlacementEnvelopeSchema.parse({
    type: "cad-suite-planner-placement",
    version: 1,
    planner,
    item,
  });
}
