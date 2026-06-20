# Platform / API Boundary Audit — Agent D

> Read-only audit. 2026-06-20. No files edited.

## 1. Complete API Route Map (35 routes)

### AI / Advisor Routes (4 — DUPLICATES)

| Route | Methods | Auth | Validation | Response | Notes |
|---|---|---|---|---|---|
| `/api/ai/advisor` | POST | Rate-limit only (IP) | messages array, plannerType enum | `{ reply, suggestion? }` | **Mock only** — no real AI call. Hardcoded responses. |
| `/api/ai-advisor` | POST | Rate-limit only (IP) | query, userId, context, stream | `AdvisorResult & { fallbackUsed }` or ndjson stream | **Primary production advisor.** Supabase `user_history`, provider chain, streaming support. |
| `/api/ai-assist` | POST | Rate-limit only (IP) | messages array | `{ content, provider, model }` | Generic chat passthrough via provider chain. No catalog context. |
| `/api/planner/ai-advisor` | POST | Rate-limit only (IP) | messages, mode, context | `{ content, suggestion? }` or `{ layout, content }` | Planner-specific advisor. Space-suggest mode parses layout JSON. |

**Duplicate finding:** `/api/ai/advisor` is a dead mock with no callers in production. `/api/ai-advisor` is the real configurator advisor. `/api/planner/ai-advisor` is the planner-scoped advisor. `/api/ai-assist` is a generic chat endpoint. Three of these four overlap in purpose.

### Catalog Admin Routes (3 sets — DUPLICATES)

| Route | Methods | Table | Auth | Notes |
|---|---|---|---|---|
| `/api/admin/buddy-catalog` | GET, POST | `configurator_products` | Admin session | Identical logic to planner-catalog. |
| `/api/admin/buddy-catalog/[id]` | PATCH, DELETE | `configurator_products` | Admin session | Soft-delete (active=false). |
| `/api/admin/planner-catalog` | GET, POST | `configurator_products` | Admin session | **Near-identical copy** of buddy-catalog. |
| `/api/admin/catalog` | GET, POST | `planner_managed_products` | Admin session | Different table. Uses `normalizePlannerManagedProductRow`. |
| `/api/admin/catalog/[id]` | PATCH, DELETE | `planner_managed_products` | Admin session | **Hard delete** (unlike buddy-catalog soft-delete). |
| `/api/admin/configurator-catalog/[id]` | PATCH, DELETE | `configurator_products` | Admin session | **Near-identical copy** of buddy-catalog/[id]. |

**Duplicate finding:** `buddy-catalog`, `planner-catalog`, and `configurator-catalog/[id]` all operate on the same `configurator_products` table with near-identical code. `catalog` and `catalog/[id]` operate on `planner_managed_products`. Two tables, three overlapping route sets.

### Product Filtering Routes (2 — PARTIAL DUPLICATE)

| Route | Methods | Auth | Notes |
|---|---|---|---|
| `/api/products` | GET | Public rate-limit | Simple list with pagination. |
| `/api/products/filter` | GET | Public rate-limit | Full faceted filter with Fuse.js search. |
| `/api/filter` | POST | Rate-limit only (IP) | **AI-powered ranking** via OpenAI/OpenRouter. Different purpose (rank vs filter). |

### Plan Persistence Routes

| Route | Methods | Auth | Backend | Notes |
|---|---|---|---|---|
| `/api/plans` | GET, POST | Supabase user session | Drizzle (`plans` table) via `plannerSaves` → `plannerPersistence` | User-scoped CRUD. POST builds `PlannerPortalPublishData`. |
| `/api/plans/[id]` | GET, PUT, DELETE | Supabase user session | Drizzle (`plans` table) | Admin can bypass ownership. Response includes `source: "drizzle_plans"`. |
| `/api/admin/plans` | GET, PATCH, DELETE | Admin session | Drizzle (`plans` table) via `plannerPersistence` | Admin listing with pagination, status filter, search. |
| `/api/admin/plans/[id]` | GET, PATCH | Admin session | Drizzle (`plans` table) | Admin detail view and status patch. |

**Plan document schema** (Drizzle `plans` table in `platform/drizzle/schema.ts`):
- `id` uuid PK
- `userId` uuid FK → profiles
- `name` text
- `engine` text ('oando')
- `payload` jsonb — full `PlannerDocument` serialized
- `thumbnailUrl` text
- `status` text ('draft' | 'active' | 'archived')
- `createdAt`, `updatedAt` timestamps

### Other Routes

| Route | Methods | Auth | Backend | Notes |
|---|---|---|---|---|
| `/api/categories` | GET | Public rate-limit | In-memory catalog | Category list with counts. |
| `/api/nav-categories` | GET | Public rate-limit | In-memory catalog | Grouped nav with subcategories. |
| `/api/nav-search` | GET, POST | Rate-limit (IP) | In-memory + optional OpenRouter | Fuse.js local + AI re-ranking. |
| `/api/recommendations` | POST | Rate-limit (IP) | Supabase `user_history` + in-memory | Personalized or popular picks. |
| `/api/tracking` | POST | Rate-limit (IP) | Supabase `user_history` + Drizzle `supabase` export | Product view tracking. |
| `/api/audit` | POST | Supabase user session | Drizzle `audit_events` via `insertEvent` | Audit trail ingestion. |
| `/api/business-stats` | GET | Public rate-limit | `features/crm/businessStats` | Cached business metrics. |
| `/api/configurator/smart-wizard` | POST | Rate-limit (IP) | Provider chain + local fallback | AI layout generation. |
| `/api/customer-queries` | POST | Rate-limit (IP, 6/hr) | Supabase `customer_queries` | Contact form submission. |
| `/api/customer-queries/manage` | GET, PATCH | Admin session or token | Supabase `customer_queries` | CRM management. |
| `/api/dev-tools/lighthouse` | GET | Public rate-limit | Filesystem (dev only) | Lighthouse report viewer. |
| `/api/generate-alt` | POST | Rate-limit (IP) | OpenAI/OpenRouter | AI alt-text generation. |
| `/api/theme/active` | GET | Public rate-limit | In-memory preset | Returns active theme tokens. |
| `/api/theme/manage` | GET, POST | Admin session | In-memory (module-level `let`) | Theme preset management. **Not persisted.** |
| `/api/admin/analytics` | GET | Admin session | Drizzle `plans` (analytics view) | Planner analytics dashboard. |
| `/api/admin/features` | GET, PATCH | Admin session | Supabase `feature_flags` table | Feature flag management. |
| `/api/admin/themes/publish` | POST | Admin session | S3 (DO Spaces + Cloudflare R2) | Theme JSON upload to CDNs. |

## 2. Duplicate Summary

### AI Advisor (4 routes, 3 overlapping)
- `/api/ai/advisor` — **dead mock**, no real AI call
- `/api/ai-advisor` — production configurator advisor (Supabase + provider chain + streaming)
- `/api/planner/ai-advisor` — planner-scoped advisor (provider chain + layout JSON)
- `/api/ai-assist` — generic chat passthrough

### Catalog Admin (3 route sets, 2 tables)
- `buddy-catalog` + `planner-catalog` + `configurator-catalog/[id]` → `configurator_products` (near-identical code)
- `catalog` + `catalog/[id]` → `planner_managed_products` (different table, different schema)

### Product Filtering (2 routes, different purpose)
- `/api/products/filter` — faceted client-side filter
- `/api/filter` — AI-powered ranking (different purpose, not a true duplicate)

## 3. Plan Persistence → Document Schema

All plan routes funnel through `features/planner/store/plannerSaves.ts` → `features/planner/store/plannerPersistence.ts` → Drizzle `plans` table.

The `PlannerDocument` model (in `features/planner/model/plannerDocument.ts`) is serialized as JSON into the `payload` jsonb column. Flat columns (`name`, `status`, `thumbnailUrl`) are denormalized from the document.

Backwards-compatible aliases (`*FromSupabase`) exist in `plannerSaves.ts` but delegate to the Drizzle-backed `*FromStore` functions.

## 4. Database Technology Usage

### Drizzle ORM (DigitalOcean Postgres)
- **`platform/drizzle/db.ts`** — `drizzle(postgres(connectionString))` via `DATABASE_URL`
- **`platform/drizzle/schema.ts`** — `profiles`, `plans`, `teams`, `teamMembers`, `invites`, `auditEvents`
- Used by: plan persistence, audit events, admin analytics

### Supabase (Legacy Catalog + Auth)
- **`platform/supabase/auth-admin.ts`** — `createSupabaseAuthAdminClient()` (service role)
- **`lib/supabase/server.ts`** — `createServerClient()` (user session)
- **`platform/drizzle/db.ts`** also exports a `supabase` proxy (legacy catalog client)
- Tables used: `user_history`, `customer_queries`, `feature_flags`, `configurator_products`, `planner_managed_products`
- Used by: auth (all user-scoped routes), catalog admin, tracking, recommendations, customer queries, feature flags

### Appwrite (Auth — Legacy/Transitional)
- **`platform/appwrite/appwrite.ts`** — server client
- **`platform/appwrite/client.ts`** — browser client
- Referenced in: `lib/auth/session.ts`, `lib/auth/plannerSession.ts`, `lib/auth/appwriteServerActions.ts`, `LoginForm.tsx`, `AccessForm.tsx`
- Schema comment: `profiles.id` maps to "Appwrite User ID"
- **Status:** Auth appears to be mid-migration from Appwrite to Supabase. Both clients exist.

### Direct Database Usage
- `app/api/tracking/route.ts` imports `supabase` from `@/platform/drizzle/db` (the legacy catalog proxy) AND `createSupabaseAuthAdminClient` — mixed clients in one file
- `app/api/admin/features/route.ts` creates its own Supabase client directly via `createClient` from `@supabase/supabase-js`

## 5. Auth Patterns

| Pattern | Routes |
|---|---|
| **No auth (public rate-limit)** | products, categories, nav-categories, nav-search, business-stats, theme/active, dev-tools/lighthouse |
| **IP rate-limit only** | ai/advisor, ai-advisor, ai-assist, filter, generate-alt, tracking, recommendations, configurator/smart-wizard, customer-queries |
| **Supabase user session** | plans/*, audit |
| **Admin session (role=admin)** | admin/*, theme/manage, customer-queries/manage |
| **Admin session OR static token** | customer-queries/manage |

## 6. Risks

1. **Four AI advisor routes** with overlapping purpose — consolidation candidate
2. **Three catalog admin route sets** on two tables — consolidation candidate
3. **Appwrite → Supabase auth migration** appears incomplete; both clients coexist
4. **`/api/tracking`** mixes two different Supabase client imports
5. **`/api/theme/manage`** stores active theme in module-level `let` — not persisted, lost on restart
6. **`/api/ai/advisor`** is a dead mock with no production value
7. **`/api/admin/features`** creates its own Supabase client instead of using the shared admin helper
