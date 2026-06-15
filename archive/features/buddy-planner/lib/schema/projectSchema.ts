import { z } from 'zod'

export const ElementSchema = z.object({
  id: z.string(),
  type: z.string(),
  x: z.number().optional(),
  y: z.number().optional(),
}).passthrough()

export const BuddyPayloadSchema = z.object({
  project: z.any().optional(),
  elements: z.record(z.string(), ElementSchema).optional(),
  floors: z.array(z.any()).optional(),
  activeFloorId: z.string().nullable().optional(),
  settings: z.any().optional(),
  engineId: z.string().optional()
}).passthrough()

export function validateBuddySchema(data: unknown) {
  return BuddyPayloadSchema.safeParse(data)
}
