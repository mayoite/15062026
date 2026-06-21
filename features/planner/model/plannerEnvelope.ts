import { z } from "zod";

import { type PlannerDocument } from "./plannerDocument";

export type PlannerTransferSource = "save" | "import" | "export";

const plannerEnvelopeMetadataSchema = z.object({
  title: z.string().min(1).max(200),
  projectName: z.string().nullable().optional(),
  clientName: z.string().nullable().optional(),
  preparedBy: z.string().nullable().optional(),
  status: z.enum(["draft", "active", "archived"]),
  unitSystem: z.enum(["metric", "imperial"]),
  itemCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const plannerTransferEnvelopeSchema = z.object({
  type: z.literal("cad-suite-planner-transfer-envelope"),
  version: z.literal(1),
  planner: z.enum(["oando", "buddy", "oofpl"]),
  source: z.enum(["save", "import", "export"]),
  documentId: z.string().min(1),
  metadata: plannerEnvelopeMetadataSchema,
  document: z.custom<PlannerDocument>(() => true),
});

export type PlannerTransferEnvelope = z.infer<typeof plannerTransferEnvelopeSchema>;
export type PlannerTransferEnvelopeMetadata = z.infer<typeof plannerEnvelopeMetadataSchema>;

export function validatePlannerTransferEnvelope(
  value: unknown,
): PlannerTransferEnvelope {
  return plannerTransferEnvelopeSchema.parse(value);
}

export function createPlannerTransferEnvelope(
  input: Omit<PlannerTransferEnvelope, "type" | "version">,
): PlannerTransferEnvelope {
  return plannerTransferEnvelopeSchema.parse({
    type: "cad-suite-planner-transfer-envelope",
    version: 1,
    ...input,
  });
}

export function buildPlannerEnvelopeMetadata(
  document: PlannerDocument,
): PlannerTransferEnvelopeMetadata {
  return {
    title: document.title ?? document.name,
    projectName: document.projectName,
    clientName: document.clientName,
    preparedBy: document.preparedBy,
    status: document.status,
    unitSystem: document.unitSystem,
    itemCount: document.itemCount,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

export function isPlannerTransferSource(
  value: string,
): value is PlannerTransferSource {
  return value === "save" || value === "import" || value === "export";
}

export function normalizePlannerTransferSource(
  value: unknown,
): PlannerTransferSource {
  return typeof value === "string" && isPlannerTransferSource(value)
    ? value
    : "save";
}
