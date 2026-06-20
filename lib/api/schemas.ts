/**
 * schemas — Zod request validation schemas for API routes.
 *
 * Each route imports the schema it needs and calls `Schema.safeParse(body)`
 * (or `Schema.parse(body)` to throw). On a failed parse, pass `error.issues`
 * to {@link validationError} to produce a 400 with field-level details.
 *
 * Schemas intentionally trim + clamp inputs so handlers receive normalized
 * values and don't repeat that logic.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** Positive integer string -> number, with fallback via `.default`. */
const positiveInt = z.coerce.number().int().positive();

/** Pagination query: `page` and `limit` with sensible bounds. */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().max(10_000).default(1),
  limit: z.coerce.number().int().positive().max(200).default(50),
});

// ---------------------------------------------------------------------------
// Catalog admin (standard / planner_managed_products)
// ---------------------------------------------------------------------------

/** Query params for listing the standard catalog. */
export const StandardCatalogListQuerySchema = PaginationQuerySchema.extend({
  category: z.string().trim().toLowerCase().optional(),
  search: z.string().trim().toLowerCase().optional(),
  visible: z.enum(["true", "false"]).optional(),
});

/** Body for creating a standard catalog item. */
export const CreateStandardCatalogItemSchema = z.object({
  id: z.string().trim().max(120).optional(),
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(100),
  subcategory: z.string().trim().max(100).optional(),
  description: z.string().trim().max(2000).optional(),
  width_mm: z.number().positive(),
  depth_mm: z.number().positive(),
  height_mm: z.number().positive(),
  price: z.number().nonnegative().optional(),
  mesh_type: z.string().trim().max(60).optional(),
  image_url: z.string().trim().max(500).optional(),
  visible: z.boolean().optional(),
});

/** Body for patching a standard catalog item (all fields optional). */
export const PatchStandardCatalogItemSchema = CreateStandardCatalogItemSchema.partial();

// ---------------------------------------------------------------------------
// Catalog admin (configurator / configurator_products)
// ---------------------------------------------------------------------------

/** Query params for listing the configurator catalog. */
export const ConfiguratorCatalogListQuerySchema = z.object({
  category: z.string().trim().toLowerCase().optional(),
  active: z.enum(["true", "false"]).optional(),
});

/** Body for creating/updating a configurator product. `buildConfiguratorRow`
 * performs deeper structural validation; this schema guards the outer shape. */
export const ConfiguratorProductBodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(100),
  slug: z.string().trim().max(120).optional(),
  sizing_type: z.enum(["parametric", "discrete", "fixed"]),
  family: z.string().trim().max(120).optional(),
  brand_name: z.string().trim().max(120).optional(),
  materials: z.array(z.string().trim()).max(50).optional(),
  thumbnail_url: z.string().trim().max(500).optional(),
  model_3d_url: z.string().trim().max(500).optional(),
  description: z.string().trim().max(2000).optional(),
  active: z.boolean().optional(),
  // Free-form sub-objects validated structurally by buildConfiguratorRow.
  workstation: z.unknown().optional(),
  size_options: z.unknown().optional(),
  default_footprint: z.unknown().optional(),
  derived_rules: z.unknown().optional(),
});

/** Lightweight active-only toggle body. */
export const ConfiguratorActiveToggleSchema = z.object({
  active: z.boolean(),
});

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

/** Body for creating/publishing a plan. */
export const CreatePlanSchema = z.object({
  id: z.string().trim().min(1).max(120),
  projectName: z.string().trim().min(1).max(200),
  status: z.enum(["draft", "active"]).optional(),
  data: z.record(z.string(), z.unknown()),
});

/** Body for updating a plan document. */
export const UpdatePlanSchema = z.object({
  document: z.unknown().optional(),
  ownerUserId: z.string().trim().max(120).optional(),
});

/** Admin plan patch body. */
export const AdminPatchPlanSchema = z.object({
  id: z.string().trim().min(1).max(120).optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  title: z.string().trim().max(200).optional(),
  project_name: z.string().trim().max(200).nullable().optional(),
  client_name: z.string().trim().max(200).nullable().optional(),
  prepared_by: z.string().trim().max(200).nullable().optional(),
});

/** Admin plan review patch (status only). */
export const AdminReviewPlanSchema = z.object({
  status: z.enum(["draft", "active", "archived"]),
  comment: z.string().trim().max(2000).optional(),
});

// ---------------------------------------------------------------------------
// AI advisor
// ---------------------------------------------------------------------------

/** Catalog advisor request (`/api/ai-advisor`). */
export const CatalogAdvisorRequestSchema = z.object({
  query: z.string().trim().min(1).max(2000),
  userId: z.string().trim().max(120).optional(),
  stream: z.boolean().optional(),
  context: z.unknown().optional(),
});

/** Planner advisor request (`/api/planner/ai-advisor`). */
export const PlannerAdvisorRequestSchema = z.object({
  mode: z.enum(["chat", "space-suggest"]).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .min(1)
    .max(20),
  context: z.unknown().optional(),
});

/** Legacy mock advisor request (`/api/ai/advisor`). */
export const LegacyAdvisorRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .min(1)
    .max(20),
  plannerType: z.enum(["oando", "buddy"]),
});

/** AI assist proxy request (`/api/ai-assist`). */
export const AiAssistRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(20),
});

// ---------------------------------------------------------------------------
// Customer queries
// ---------------------------------------------------------------------------

/** Public customer query submission. */
export const CustomerQuerySchema = z.object({
  name: z.string().trim().min(1).max(180),
  company: z.string().trim().max(180).optional(),
  email: z.string().trim().max(180).optional(),
  phone: z.string().trim().max(50).optional(),
  preferredContact: z.enum(["email", "whatsapp", "phone", "any"]).optional(),
  message: z.string().trim().min(1).max(5000),
  requirement: z.string().trim().max(300).optional(),
  budget: z.string().trim().max(120).optional(),
  timeline: z.string().trim().max(120).optional(),
  source: z.string().trim().max(60).optional(),
  sourcePath: z.string().trim().max(200).optional(),
}).refine((data) => Boolean(data.email || data.phone), {
  message: "Please provide email or phone.",
  path: ["email"],
});

/** Admin customer-query patch. */
export const PatchCustomerQuerySchema = z.object({
  id: z.string().trim().min(1).max(80),
  status: z.enum(["new", "in_progress", "closed", "spam"]),
  followUpChannel: z.enum(["email", "whatsapp", "phone", "none"]),
  followUpTarget: z.string().trim().max(250).optional(),
  followUpNotes: z.string().trim().max(2000).optional(),
});

// ---------------------------------------------------------------------------
// Misc: audit, tracking, recommendations, theme, filter, nav-search, generate-alt
// ---------------------------------------------------------------------------

/** Audit event insertion. */
export const AuditEventSchema = z.object({
  team_id: z.string().trim().min(1).max(120),
  action: z.string().trim().min(1).max(120),
  target_type: z.string().trim().min(1).max(120),
  target_id: z.string().trim().max(120).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/** Product view tracking. */
export const TrackingSchema = z.object({
  productId: z.string().trim().min(1).max(120),
  userId: z.string().trim().max(120).optional(),
});

/** Recommendations request. */
export const RecommendationsSchema = z.object({
  userId: z.string().trim().max(120).optional(),
  limit: z.number().int().min(1).max(8).optional(),
});

/** Theme activation. */
export const ActivateThemeSchema = z.object({
  presetId: z.string().trim().min(1).max(120),
});

/** Theme publish. */
export const PublishThemeSchema = z.object({
  themeName: z.string().trim().regex(/^[a-z0-9][a-z0-9-_]{1,63}$/i),
  tokens: z.record(z.string(), z.unknown()),
});

/** Feature flag patch. */
export const FeatureFlagsPatchSchema = z.object({
  key: z.string().trim().max(120).optional(),
  enabled: z.boolean().optional(),
  updates: z.record(z.string(), z.boolean()).optional(),
}).refine(
  (data) => Boolean(data.updates && Object.keys(data.updates).length > 0) || Boolean(data.key),
  { message: "No updates provided", path: ["updates"] },
);

/** Filter/rank request. */
export const FilterRankSchema = z.object({
  products: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string(),
        description: z.string().optional(),
        sustainabilityScore: z.number().optional(),
        priceRange: z.string().optional(),
        material: z.array(z.string()).optional(),
        bifmaCertified: z.boolean().optional(),
        isHeightAdjustable: z.boolean().optional(),
        hasHeadrest: z.boolean().optional(),
      }),
    )
    .min(1),
  category: z.string().optional(),
  rankBy: z.enum(["sustainability", "price", "material", "ergonomic"]),
});

/** Generate alt text request. */
export const GenerateAltSchema = z.object({
  category: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
});

/** Nav search request. */
export const NavSearchSchema = z.object({
  query: z.string().trim().min(1).max(200),
  limit: z.number().int().min(1).max(12).optional(),
  context: z.enum(["header", "mobile"]).optional(),
});

/** Smart wizard request. */
export const SmartWizardSchema = z.object({
  templateId: z.string().trim().min(1).max(120),
  roomType: z.enum(["open-plan", "executive", "studio", "coworking", "blank"]).optional(),
  roomWidthMm: z.number().positive().finite(),
  roomLengthMm: z.number().positive().finite(),
  style: z.string().trim().max(60).optional(),
});

export { positiveInt };
