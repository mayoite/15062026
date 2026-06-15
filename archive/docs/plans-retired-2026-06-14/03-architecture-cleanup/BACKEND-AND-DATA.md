# 05 — Backend and Data

*Created: 2026-06-11 — Auth, databases, storage, API contracts, environment variables.*
*Updated: 2026-06-12 — Live DB verification with `.env.local`; Drizzle `plans` bootstrapped.*

## Architecture Overview

| Concern | Service | SDK / ORM |
|---|---|---|
| Identity & sessions | Appwrite | `platform/appwrite/` |
| Plans/profiles database | DigitalOcean Managed Postgres | Drizzle ORM (`platform/drizzle/`) |
| User data, CRM, planner saves | Supabase Admin | `platform/supabase/auth-admin.ts` |
| Product catalog database | Supabase Catalog | `platform/supabase/client.ts`, `lib/supabase/` |
| Blob storage | Cloudflare R2 | Fetch API / R2 SDK |
| Email / messaging | Appwrite Messaging | Appwrite SDK (no Resend/SendGrid in app code) |

> ⚠️ There are **three databases**, not two. Supabase Admin and Supabase Catalog use different URL/key pairs. Do not mix their clients.

---

## 1. Authentication (Appwrite)

**Location:** `packages/lib/auth/` (protected path), `platform/appwrite/`

### Session Flow

1. User visits `/login` → `LoginForm` submits credentials to Appwrite
2. Appwrite returns session cookie (HTTP-only, SSR-compatible)
3. Next.js middleware (`proxy.ts`) reads cookie on every request
4. Middleware injects `x-user-id` and `x-user-role` headers for downstream use
5. Canvas routes check session in `PlannerWorkspaceRoute` — falls back to guest mode if no session

### Role Guard Rules

- `/ops/*` routes require `admin` role — enforced in middleware, not just UI
- `/planner/canvas` allows both member and guest — no hard auth gate
- `/admin/*` requires `admin` role — enforced in middleware

### Protected Paths

- `packages/lib/auth/` — do not edit without explicit approval
- `proxy.ts` (root) — do not edit without explicit approval
- `app/api/auth/` — do not edit without explicit approval

### Acceptance Criteria

- [ ] Login redirects to `?next=` param after success
- [ ] Expired session → redirect to `/login` with original path as `?next=`
- [ ] Guest access to `/planner/guest` works without any auth cookie
- [ ] Admin role gate blocks non-admin users from `/ops/*` with 403 (not just redirect)
- [ ] CSRF: all mutations use POST with Appwrite session token — no GET-based state changes

---

## 2. DigitalOcean Postgres (Drizzle ORM)

**Location:** `platform/drizzle/`
**Env var:** `DATABASE_URL` (secret, server-only)

### Schema Summary

| Table | Purpose |
|---|---|
| `profiles` | Display name, preferences, Appwrite UID mapping |
| `plans` | Planner document metadata (title, updated_at, owner) |
| `teams` / `team_members` / `invites` | Collaboration (Phase 3+) |
| `audit_events` | Server-side audit log |
| (ops tables) | CRM contacts, quote requests, lead events |

### Rules

- Schema changes require a Drizzle migration file — never alter tables manually
- `platform/drizzle/` is a protected path — stop and confirm before editing migrations
- All queries via Drizzle ORM — no raw SQL in app code
- Server-only: never import Drizzle from a client component

### Acceptance Criteria

- [x] `npm run typecheck` passes with Drizzle schema types (2026-06-12)
- [x] `npm run db:test` — `DATABASE_URL` connects; `plans` + `profiles` present (2026-06-12)
- [x] `npm run db:ensure-plans` — idempotent bootstrap when legacy DB lacks `plans` table
- [ ] `npx drizzle-kit migrate` — full `0000` migration blocked when partial legacy schema exists
- [ ] `npx drizzle-kit studio` connects and shows correct tables

---

## 3. Supabase Admin DB (User Data, CRM, Planner Saves)

**Location:** `platform/supabase/auth-admin.ts`
**Env vars:** `NEXT_ADMIN_SUPABASE_URL`, `SUPABASE_ADMIN_SERVICE_ROLE_KEY` (both secret, server-only)

> ⚠️ The service role key bypasses RLS. Never import `auth-admin.ts` from a client component or browser-side code.

### Tables

| Table | Purpose |
|---|---|
| `planner_saves` | Serialised `PlannerDocument` JSON per authenticated user |
| `user_history` | Event log for user actions |
| `customer_queries` | CRM — inbound contact/quote requests |
| `profiles` | Extended user profile (links to Appwrite UID) |
| `quotes` | Quote requests with BOQ snapshot |
| `templates` | Saved room templates |

### planner_saves RLS Policies

**Required policies:**
```sql
-- Users can only read their own saves
CREATE POLICY "Users read own saves"
ON planner_saves FOR SELECT
USING (user_id = current_user_id());

-- Users can only insert their own saves
CREATE POLICY "Users insert own saves"
ON planner_saves FOR INSERT
WITH CHECK (user_id = current_user_id());

-- Users can only update their own saves
CREATE POLICY "Users update own saves"
ON planner_saves FOR UPDATE
USING (user_id = current_user_id());
```

**Test required**: Verify user A cannot read user B's planner_saves rows.

### planner_saves Column Contract

> ⚠️ **Critical risk**: This table has **no tracked migration**. It is written to by multiple code paths. The schema must be derived from `features/planner/data/persistence/plannerPersistence.ts` and a migration must be applied before any production save operation.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, `gen_random_uuid()` default |
| `user_id` | `text` | Appwrite UID — not a FK to Supabase `auth.users` |
| `document` | `jsonb` | Full serialised `PlannerDocument` |
| `version` | `integer` | Schema version for migration adapters |
| `name` | `text` | Human-readable project name |
| `thumbnail_url` | `text` | R2 URL of plan preview image (nullable) |
| `created_at` | `timestamptz` | Auto-set on insert |
| `updated_at` | `timestamptz` | Auto-updated on every save |

### Rules

- All writes via server-only API route (`app/api/planner/save`) — never directly from browser
- RLS policy: user can only read/write their own rows (`user_id = requesting user`)
- Guest saves stay in IndexedDB only — never written to this table
- A tracked migration file must exist before this table is written to in production
- `version` field must be incremented when `PlannerDocument` schema changes; adapters must handle old versions

### Acceptance Criteria

- [ ] Migration file exists in `platform/supabase/` for `planner_saves`
- [ ] `POST /api/planner/save` rejects requests without a valid Appwrite session
- [ ] `GET /api/planner/load` returns only the requesting user's own saves
- [ ] Round-trip: save → load → compare produces identical `PlannerDocument`
- [ ] Guest mode: no write to this table, confirmed by DB query after guest session

---

## 4. Supabase Catalog DB (Product Catalog)

**Location:** `platform/supabase/client.ts`, `lib/supabase/`
**Env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public)

### Usage

- Read-only from the app — catalog data is curated externally
- Supabase client initialised in `lib/supabase/client.ts` (browser) and `lib/supabase/server.ts` (SSR)
- Catalog queries cached via Next.js `fetch` with `revalidate` — not fetched on every request

### Tables Used

| Table | Purpose |
|---|---|
| `products` | Furniture catalog items |
| `categories` | Product category tree |
| `product_images` | Image URLs (pointing to R2) |

### Rules

- `anon` key only — never `service_role` key in browser code
- Catalog data is read-only from the app; writes happen via admin tooling
- Never confuse this client with `auth-admin.ts`

### Acceptance Criteria

- [ ] Catalog page loads in < 1.5 s (SSR + cache)
- [ ] Product images resolve — no broken `<img>` on catalog or PDP routes
- [ ] Filter by category returns correct subset
- [ ] `NEXT_PUBLIC_SUPABASE_URL` points to catalog DB, not admin DB

---

## 5. Blob Storage (Cloudflare R2)

- Product images, brochure downloads, and exported PDFs
- URLs referenced via `lib/assetPaths.ts` — never hardcoded in components
- Image delivery: Next.js `<Image>` with R2 domain in `next.config.js` `images.remotePatterns`

### Rules

- All image imports through `lib/assetPaths.ts` constants or `data/site/` data files
- No hardcoded R2 URLs in components or CSS
- PDF exports written to R2 with a signed URL returned to client

---

## 6. API Route Contracts

All API routes live under `app/api/`. They are grouped by domain.

### Planner API

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/planner/ai-advisor` | POST | optional | AI chat/furnish/wizard |
| `/api/planner/save` | POST | required | Persist `PlannerDocument` to Admin DB |
| `/api/planner/load` | GET | required | Fetch latest save for current user |
| `/api/planner/export/pdf` | POST | optional | Generate BOQ PDF |
| `/api/planner/export/json` | POST | optional | Export JSON session |

### Site API

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/contact` | POST | none | Contact form → Appwrite Messaging |
| `/api/quote` | POST | none | Quote request → CRM (Admin DB `customer_queries`) |
| `/api/catalog` | GET | none | Catalog search proxy |

### Rules

- All routes validate input with Zod before touching a database
- Error responses follow `{ error: string, code?: string }` shape
- No route returns stack traces in production
- Rate limiting applied to all public POST routes via `lib/rateLimit.ts`
- Quote/BOQ data must be stored server-side — do not rely on `localStorage` as the sole handoff mechanism

---

## 7. Environment Variables

**Reference file:** `.env.example`

### Required Variables

| Variable | Used by | Secret? |
|---|---|---|
| `NEXT_PUBLIC_APPWRITE_ENDPOINT` | Auth | No (public) |
| `NEXT_PUBLIC_APPWRITE_PROJECT_ID` | Auth | No (public) |
| `APPWRITE_API_KEY` | Server-side auth | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Catalog DB | No (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Catalog DB | No (public) |
| `NEXT_ADMIN_SUPABASE_URL` | Admin DB | Yes |
| `SUPABASE_ADMIN_SERVICE_ROLE_KEY` | Admin DB | Yes — never expose to browser |
| `DATABASE_URL` | Drizzle / DO Postgres | Yes |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | Asset upload | Yes |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | Asset upload | Yes |
| `CLOUDFLARE_R2_BUCKET` | Asset paths | Yes |
| `NEXT_PUBLIC_TLDRAW_LICENSE_KEY` | Tldraw canvas | No (public) |
| `OPENAI_API_KEY` | AI advisor | Yes |

### Rules

- Never commit `.env` or `.env.local` — only `.env.example` is in the repo
- `NEXT_PUBLIC_*` variables are exposed to the browser — only put non-sensitive values there
- All secret variables must only be accessed via `lib/env.server.ts`, which throws at build/runtime if a required variable is missing
- Do not access `process.env.X` directly in components — go through `lib/env.server.ts`
- `.env.example` must be kept in sync with `lib/env.server.ts` validation list

---

## 8. Known Risks

| Risk | Severity | Status | Action |
|---|---|---|---|
| 🔴 **Dual-write race**: user `/api/plans` vs Drizzle `plans` | **CRITICAL** | **Partial** — user `/api/plans` writes via `savePlannerDocumentToStore` → Drizzle `plans` only; `npm run db:test` confirms table (2026-06-12) | Admin routes (`app/api/admin/plans/*`) still read/write Supabase `planner_saves` — no tracked migration in `platform/supabase/migrations.admin/` |
| 🔴 No rollback for planner_saves partial writes (document saved but thumbnail fails) | **CRITICAL** | Unresolved — P0 | Add transaction boundary or compensating rollback |
| 🔴 Guest→auth migration missing (IndexedDB data lost on signup) | **CRITICAL** | Unresolved — P0 | Add claim flow: signup → migrate IndexedDB → write to planner_saves |
| 🔴 Concurrent edit conflict (two tabs = last-write-wins = data loss) | **CRITICAL** | Unresolved — P0 | Add optimistic locking with version field |
| 🔴 planner_saves RLS policies unspecified (may not exist) | **CRITICAL** | Unresolved — P0 | Document exact RLS policy; add test |
| `planner_saves` has no tracked migration | Critical | Unresolved — Phase 0 blocker | Derive schema from code; generate migration |
| Quote/BOQ handoff via `localStorage` only | High | Must move to server-side in Phase 4 | Add quote persistence to Admin DB |
| `typescript.ignoreBuildErrors: true` masks ~294 planner errors | High | Inventory and resolve in Phase 0 | Remove suppressor after error fixes |
| Admin service role key exposure if imported client-side | Critical | **Mitigated** — `import "server-only"` added to `platform/supabase/auth-admin.ts` and `platform/drizzle/db.ts` (2026-06-12) | Verify no client bundle imports remain |

---

## 10. Ideas from Brainstorming Session (2026-06-11)

These are technical architecture ideas from expert review — not yet implemented, but reduce known risks.

### Branded DB Client Types (Phase 1)
Wrap the three database clients in nominal branded types (`type AdminDbClient = SupabaseClient & { _brand: 'admin' }`) so passing the wrong client is a compile error, not a code-review finding. **Why:** Both Supabase clients are currently structurally identical to TypeScript; this makes mix-up impossible at zero runtime cost.

### `import 'server-only'` at DB entry points (Phase 0)
Add `import 'server-only'` to `platform/supabase/auth-admin.ts` and `platform/drizzle/db.ts`. **Why:** Next.js 14 throws a build error if either file enters a client bundle — stronger than lint rules; prevents admin service role key leaking structurally.

### `planner_saves` schema codegen from TypeScript (Phase 0)
Write `planner_saves` column types in TypeScript (`PlannerSavesRow`), then use a script to generate the Supabase SQL migration from the type. **Why:** The current risk is the schema and code drifting; this makes the TypeScript type the source of truth and migration files are generated artifacts.

### WhatsApp BOQ Share API (Phase 4)
Export panel sends BOQ PDF via WhatsApp Business API; simultaneously pings assigned sales rep. **Why:** India runs on WhatsApp; PDF in email gets ignored, PDF in WhatsApp opens within minutes; closes last-mile gap to sales conversation.

---

## 9. Protected Paths (stop and confirm before editing)

- `proxy.ts` (root) — middleware session enforcement
- `platform/supabase/` — Supabase schema and migrations
- `platform/drizzle/` — Drizzle schema and migrations
- `packages/lib/auth/` — Auth utilities
- `packages/lib/ai/` — AI provider chain
- `config/build/` — TypeScript and ESLint config
- `app/api/auth/` — Auth API routes
