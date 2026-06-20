# Report 08: API, Database & Dependencies

**Audit Date:** 2026-06-20  
**Auditor:** Agent D  
**Scope:** API design patterns, database architecture, dependency management, legacy code removal

---

## Executive Summary

The Oando Platform has a modern API architecture using Next.js App Router with consistent patterns, but suffers from duplicate routes, inconsistent auth middleware, and legacy Appwrite residue that should be removed. The database layer uses Drizzle ORM with Supabase/PostgreSQL, which is well-structured but has migration inconsistencies. Dependencies are generally modern but include unused packages and legacy auth providers.

**Overall Scores:**
- API Design: 65/100 (Needs Improvement)
- Database Architecture: 75/100 (Good)
- Dependency Management: 60/100 (Needs Cleanup)
- Legacy Code Removal: 40/100 (Critical)

---

## 1. API Design

### 1.1 Route Structure

**Status:** ⚠️ Inconsistent

**Current Structure:**
```
app/api/
├── admin/
│   ├── catalog/
│   │   ├── route.ts (GET, POST)
│   │   └── [id]/route.ts (GET, PUT, DELETE)
│   ├── configurator-catalog/
│   │   ├── route.ts (GET, POST)
│   │   └── [id]/route.ts (GET, PUT, DELETE)
│   ├── buddy-catalog/
│   │   ├── route.ts (GET, POST)
│   │   └── [id]/route.ts (GET, PUT, DELETE)
│   ├── features/route.ts
│   ├── themes/
│   │   ├── route.ts
│   │   └── publish/route.ts
│   └── _lib/server.ts (shared utilities)
├── customer-queries/
│   ├── route.ts
│   └── manage/route.ts
├── plans/
│   ├── route.ts
│   └── [id]/route.ts
├── products/
│   └── filter/route.ts
├── recommendations/route.ts
├── tracking/route.ts
├── audit/route.ts
├── ai-advisor/route.ts
└── dev-tools/
    └── lighthouse/route.ts
```

**Issues:**

| Severity | Issue | Impact | Remediation |
|----------|-------|--------|-------------|
| High | Duplicate catalog routes (3 variants) | Code duplication, maintenance burden | Consolidate into single parameterized route |
| High | Inconsistent auth patterns | Security gaps, unclear access control | Standardize auth middleware |
| Medium | Mixed REST conventions | Confusing API surface | Enforce consistent REST patterns |
| Medium | Missing API versioning | Breaking changes affect all clients | Add /api/v1/ prefix |
| Low | No rate limiting middleware | Vulnerable to abuse | Add rate limiting |

### 1.2 Duplicate Routes

**Critical Finding:** Three nearly identical catalog management routes

**Files:**
- `app/api/admin/catalog/route.ts` (176 lines)
- `app/api/admin/configurator-catalog/route.ts` (similar structure)
- `app/api/admin/buddy-catalog/route.ts` (similar structure)

**Code Comparison:**
```typescript
// All three follow this pattern:
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  
  // Similar query logic with minor variations
  const items = await db.select().from(catalogTable).where(...);
  
  return Response.json({ items });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  // Similar validation and insertion
  const newItem = await db.insert(catalogTable).values(body).returning();
  
  return Response.json(newItem);
}
```

**Recommended Consolidation:**
```typescript
// app/api/admin/catalog/[type]/route.ts
// type = 'standard' | 'configurator' | 'buddy'

const CATALOG_TYPES = {
  standard: { table: catalogTable, schema: standardCatalogSchema },
  configurator: { table: configuratorCatalogTable, schema: configuratorSchema },
  buddy: { table: buddyCatalogTable, schema: buddySchema },
} as const;

export async function GET(
  request: Request,
  { params }: { params: { type: keyof typeof CATALOG_TYPES } }
) {
  const config = CATALOG_TYPES[params.type];
  if (!config) {
    return Response.json({ error: 'Invalid catalog type' }, { status: 400 });
  }
  
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  
  const items = await db.select().from(config.table).where(
    category ? eq(config.table.category, category) : undefined
  );
  
  return Response.json({ items, type: params.type });
}
```

**Benefits:**
- Reduces 3 routes to 1 parameterized route
- Eliminates ~300 lines of duplicate code
- Easier to maintain and extend
- Consistent behavior across catalog types

### 1.3 Authentication Middleware

**Status:** ❌ Inconsistent

**Current Patterns:**

**Pattern 1: Direct Supabase check**
```typescript
// app/api/admin/catalog/route.ts
import { createSupabaseAuthAdminClient } from '@/platform/supabase/auth-admin';

export async function GET(request: Request) {
  const supabase = createSupabaseAuthAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // ... route logic
}
```

**Pattern 2: Custom auth helper**
```typescript
// app/api/plans/route.ts
import { requireAuthUser } from '@/lib/auth/session';

export async function GET(request: Request) {
  const user = await requireAuthUser('/planner');
  
  // ... route logic
}
```

**Pattern 3: No auth (public routes)**
```typescript
// app/api/customer-queries/route.ts
export async function POST(request: Request) {
  // No auth check - public form submission
  const body = await request.json();
  // ... route logic
}
```

**Pattern 4: Token-based (admin only)**
```typescript
// app/api/admin/features/route.ts
export async function GET(request: Request) {
  const token = request.headers.get('authorization');
  
  if (token !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // ... route logic
}
```

**Issues:**
1. Four different auth patterns create confusion
2. Some routes check auth, others don't (unclear which should)
3. No role-based access control (RBAC)
4. No consistent error response format
5. Mixed use of Supabase auth vs custom tokens

**Recommended Standardization:**
```typescript
// lib/api/auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAuthAdminClient } from '@/platform/supabase/auth-admin';

export type AuthContext = {
  user: { id: string; email: string; role: string };
  isAdmin: boolean;
};

export async function withAuth(
  handler: (req: NextRequest, auth: AuthContext) => Promise<NextResponse>,
  options: { requireAdmin?: boolean } = {}
) {
  return async (req: NextRequest) => {
    try {
      const supabase = createSupabaseAuthAdminClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      const isAdmin = user.user_metadata?.role === 'admin' || 
                      process.env.ADMIN_EMAILS?.split(',').includes(user.email);
      
      if (options.requireAdmin && !isAdmin) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
      
      const auth: AuthContext = {
        user: {
          id: user.id,
          email: user.email!,
          role: isAdmin ? 'admin' : 'user',
        },
        isAdmin,
      };
      
      return handler(req, auth);
    } catch (error) {
      console.error('Auth error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }
  };
}

// Usage in routes:
export const GET = withAuth(async (req, auth) => {
  // Route logic with guaranteed auth context
  return NextResponse.json({ userId: auth.user.id });
});

export const POST = withAuth(async (req, auth) => {
  // Admin-only route
  return NextResponse.json({ success: true });
}, { requireAdmin: true });
```

### 1.4 Error Response Format

**Status:** ❌ Inconsistent

**Current Patterns:**

**Pattern 1: Simple error string**
```typescript
return Response.json({ error: 'Not found' }, { status: 404 });
```

**Pattern 2: Error with code**
```typescript
return Response.json({ 
  error: 'Not found',
  code: 'RESOURCE_NOT_FOUND'
}, { status: 404 });
```

**Pattern 3: Error with details**
```typescript
return Response.json({ 
  message: 'Validation failed',
  details: { field: 'email', reason: 'Invalid format' }
}, { status: 400 });
```

**Pattern 4: HTML error page**
```typescript
return new Response('<h1>500 Internal Server Error</h1>', {
  status: 500,
  headers: { 'Content-Type': 'text/html' }
});
```

**Recommended Standard:**
```typescript
// lib/api/errors.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
  }
}

export function formatApiError(error: ApiError) {
  return {
    error: {
      code: error.code,
      message: error.message,
      ...(error.details && { details: error.details }),
    },
  };
}

// Standard error codes
export const ERROR_CODES = {
  // 400 Bad Request
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // 401 Unauthorized
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // 403 Forbidden
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // 404 Not Found
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  
  // 409 Conflict
  RESOURCE_EXISTS: 'RESOURCE_EXISTS',
  
  // 429 Too Many Requests
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // 500 Internal Server Error
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

// Usage:
throw new ApiError(
  404,
  ERROR_CODES.RESOURCE_NOT_FOUND,
  'Plan not found',
  { planId: id }
);
```

### 1.5 Input Validation

**Status:** ⚠️ Partial

**Current State:**
- Some routes use Zod schemas
- Others have no validation
- Validation logic scattered across routes

**Recommended Centralization:**
```typescript
// lib/api/validation.ts
import { z } from 'zod';

// Catalog schemas
export const CreateCatalogItemSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  dimensions: z.object({
    width: z.number().positive(),
    depth: z.number().positive(),
    height: z.number().positive(),
  }),
  price: z.number().positive().optional(),
  images: z.array(z.string().url()).optional(),
});

export const UpdateCatalogItemSchema = CreateCatalogItemSchema.partial();

// Plan schemas
export const CreatePlanSchema = z.object({
  name: z.string().min(1).max(200),
  engine: z.enum(['fabric', 'threejs']),
  payload: z.record(z.unknown()),
});

export const UpdatePlanSchema = CreatePlanSchema.partial();

// Query parameter schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const CatalogFilterSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Usage in routes:
export async function POST(request: Request) {
  const body = await request.json();
  const validated = CreateCatalogItemSchema.parse(body);
  
  // validated is now type-safe
  const item = await db.insert(catalogTable).values(validated).returning();
  
  return Response.json(item);
}
```

---

## 2. Database Architecture

### 2.1 ORM and Database

**Status:** ✅ Good

**Stack:**
- **ORM:** Drizzle ORM (modern, type-safe)
- **Database:** PostgreSQL (DigitalOcean Managed)
- **Auth DB:** Supabase (separate instance)
- **Legacy:** Supabase for catalog (being migrated)

**Schema Structure:**
```typescript
// platform/drizzle/schema.ts

// Core tables
profiles        // User profiles (maps to Supabase auth.users)
plans           // Planner documents (fabric/threejs)
teams           // Team organization
team_members    // Team membership
invites         // Team invitations
audit_events    // Action audit trail

// Relationships
profiles 1:N plans
teams 1:N team_members
profiles 1:N team_members
teams 1:N invites
profiles 1:N invites
teams 1:N audit_events
```

**Strengths:**
- Type-safe queries with Drizzle
- Proper foreign key constraints
- Cascade deletes configured
- Audit trail for compliance
- Separation of concerns (auth vs data)

**Issues:**

| Severity | Issue | Impact | Remediation |
|----------|-------|--------|-------------|
| Medium | No database migrations tracked | Schema drift risk | Add Drizzle Kit migrations |
| Medium | Missing indexes on foreign keys | Slow joins | Add indexes |
| Medium | No soft deletes | Data loss risk | Add deleted_at column |
| Low | No database versioning | Hard to track schema changes | Add schema version table |

### 2.2 Migration Strategy

**Status:** ❌ Not Implemented

**Current State:**
- No Drizzle Kit configuration
- No migration files
- Schema changes done manually
- No rollback capability

**Recommended Setup:**
```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './platform/drizzle/schema.ts',
  out: './platform/drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;

// package.json scripts
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx scripts/seed.ts"
  }
}
```

**Migration Workflow:**
```bash
# 1. Make schema changes
# platform/drizzle/schema.ts

# 2. Generate migration
npm run db:generate

# 3. Review migration file
# platform/drizzle/migrations/0000_xxx.sql

# 4. Apply migration
npm run db:migrate

# 5. Commit migration file to git
git add platform/drizzle/migrations/
git commit -m "Add migration: xxx"
```

### 2.3 Missing Indexes

**Status:** ⚠️ Needs Improvement

**Current Schema:**
```typescript
export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id),
  name: text('name').notNull(),
  status: text('status').notNull().default('draft'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

**Missing Indexes:**
```typescript
// Recommended additions:
export const plans = pgTable('plans', {
  // ... existing columns
}, (table) => ({
  userIdIdx: index('plans_user_id_idx').on(table.userId),
  statusIdx: index('plans_status_idx').on(table.status),
  createdAtIdx: index('plans_created_at_idx').on(table.createdAt),
  userIdStatusIdx: index('plans_user_id_status_idx').on(table.userId, table.status),
}));

export const teamMembers = pgTable('team_members', {
  // ... existing columns
}, (table) => ({
  teamIdIdx: index('team_members_team_id_idx').on(table.teamId),
  userIdIdx: index('team_members_user_id_idx').on(table.userId),
}));
```

**Performance Impact:**
- Queries filtering by `userId` will be slow without index
- Listing plans by status requires full table scan
- Team member lookups need indexes for joins

### 2.4 Soft Deletes

**Status:** ❌ Not Implemented

**Current State:**
- Hard deletes only (`onDelete: 'cascade'`)
- No audit trail for deletions
- Data recovery impossible

**Recommended Implementation:**
```typescript
import { timestamp } from 'drizzle-orm/pg-core';

export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id),
  name: text('name').notNull(),
  status: text('status').notNull().default('draft'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'), // Soft delete marker
});

// Query helper to exclude soft-deleted records
export function activePlans() {
  return db.select().from(plans).where(isNull(plans.deletedAt));
}

// Soft delete function
export async function softDeletePlan(planId: string) {
  await db.update(plans)
    .set({ deletedAt: new Date() })
    .where(eq(plans.id, planId));
}
```

---

## 3. Dependency Management

### 3.1 Current Dependencies

**Status:** ⚠️ Needs Cleanup

**package.json Analysis:**

**Core Dependencies (Keep):**
```json
{
  "next": "^15.0.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "typescript": "^5.0.0",
  "@supabase/supabase-js": "^2.0.0",
  "@supabase/ssr": "^0.5.0",
  "drizzle-orm": "^0.30.0",
  "postgres": "^3.0.0",
  "zod": "^3.0.0",
  "zustand": "^4.0.0",
  "fabric": "^6.0.0",
  "three": "^0.170.0",
  "@react-three/fiber": "^8.0.0",
  "@react-three/drei": "^9.0.0",
  "tailwindcss": "^3.4.0"
}
```

**Legacy Dependencies (Remove):**
```json
{
  "appwrite": "^15.0.0",           // ❌ Legacy auth provider
  "node-appwrite": "^15.0.0"       // ❌ Legacy auth provider (server)
}
```

**Potentially Unused (Audit):**
```json
{
  "@better-fetch/fetch": "^1.0.0",  // Check usage
  "better-auth": "^1.0.0",          // Check usage
  "resend": "^3.0.0",               // Check if email sending is used
}
```

### 3.2 Appwrite Residue

**Status:** ❌ Critical - Must Remove

**Files Containing Appwrite References:**

**Core Files (Must Delete):**
1. `platform/appwrite/` (entire directory)
   - `client.ts` - Appwrite client initialization
   - `appwrite.ts` - Duplicate client
   - `CONTENTS.md` - Documentation

2. `lib/auth/appwriteServerActions.ts` (delete)
   - Server actions for Appwrite auth
   - loginWithAppwrite, signupWithAppwrite, logoutFromAppwrite

**Files with Appwrite Imports (Must Update):**
3. `lib/auth/session.ts` (lines 7-8)
   ```typescript
   import { Client, Account } from "node-appwrite";
   import { getAppwriteRuntimeConfig } from '@/platform/appwrite/client';
   ```

4. `lib/auth/plannerSession.ts` (line 10)
   ```typescript
   import { getAppwriteRuntimeConfig } from '@/platform/appwrite/client';
   ```

5. `app/(site)/login/LoginForm.tsx` (lines 10-11)
   ```typescript
   import { isAppwriteConfigured } from '@/platform/appwrite/client';
   import { loginWithAppwrite, signupWithAppwrite } from "@/lib/auth/appwriteServerActions";
   ```

6. `app/(site)/access/AccessForm.tsx` (lines 9, 12)
   ```typescript
   import { isAppwriteConfigured } from '@/platform/appwrite/client';
   import { loginWithAppwrite } from "@/lib/auth/appwriteServerActions";
   ```

**Configuration Files (Must Update):**
7. `.env.example` (lines 70-83)
   ```
   # APPWRITE 
   NEXT_PUBLIC_APPWRITE_ENDPOINT=
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=
   APPWRITE_URL=
   APPWRITE_PROJECT_ID=
   APPWRITE_SECRET_KEY=
   ```

8. `package.json` (lines 113, 131)
   ```json
   "appwrite": "^15.0.0",
   "node-appwrite": "^15.0.0"
   ```

**Removal Plan:**

**Step 1: Delete Appwrite files**
```bash
rm -rf platform/appwrite/
rm lib/auth/appwriteServerActions.ts
```

**Step 2: Update auth files to use Supabase only**
```typescript
// lib/auth/session.ts - REMOVE Appwrite imports
// BEFORE:
import { Client, Account } from "node-appwrite";
import { getAppwriteRuntimeConfig } from '@/platform/appwrite/client';

// AFTER:
// (no Appwrite imports needed)

// Update getOptionalUser to use Supabase:
export async function getOptionalUser(): Promise<SharedSessionUser | null> {
  const supabase = createSupabaseAuthAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  return {
    id: user.id,
    email: user.email || "",
    name: user.user_metadata?.name,
    avatarUrl: user.user_metadata?.avatar_url,
    role: (user.user_metadata?.role === 'admin' ? 'owner' : 'member') as PlannerRole,
  };
}
```

**Step 3: Update login forms**
```typescript
// app/(site)/login/LoginForm.tsx
// BEFORE:
import { isAppwriteConfigured } from '@/platform/appwrite/client';
import { loginWithAppwrite } from "@/lib/auth/appwriteServerActions";

// AFTER:
import { createClient } from '@/platform/supabase/client';

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    setError(error.message);
    return;
  }
  
  window.location.assign(nextPath);
}
```

**Step 4: Remove from package.json**
```bash
npm uninstall appwrite node-appwrite
```

**Step 5: Clean .env files**
```bash
# Remove all APPWRITE_* variables from .env.example
# Remove from .env.local if present
```

**Step 6: Update documentation**
- Remove Appwrite references from README.md
- Update architecture docs to show Supabase-only auth
- Update deployment guides

### 3.3 Dependency Audit

**Recommended Actions:**

**1. Check for outdated packages:**
```bash
npm outdated
```

**2. Check for security vulnerabilities:**
```bash
npm audit
```

**3. Remove unused dependencies:**
```bash
# Use depcheck to find unused deps
npx depcheck

# Remove confirmed unused
npm uninstall <package-name>
```

**4. Update major versions (with testing):**
```bash
# Update one at a time and test
npm install next@latest
npm run test
npm run typecheck
npm run lint
```

**5. Lock dependency versions:**
```json
// package.json - use exact versions for critical deps
{
  "dependencies": {
    "react": "19.0.0",  // Exact, no ^
    "next": "15.0.0"    // Exact, no ^
  }
}
```

---

## 4. Legacy Code Removal

### 4.1 tldraw References

**Status:** ⚠️ Partially Cleaned

**Remaining References:**

**Documentation (Safe to Remove):**
```typescript
// platform/drizzle/schema.ts:15
engine: text('engine').notNull(), // 'tldraw' (Buddy) or 'threejs' (Oando)
// Update comment: 'fabric' (2D) or 'threejs' (3D)
```

**Code (Check Usage):**
```bash
# Search for tldraw imports
grep -r "tldraw" --include="*.ts" --include="*.tsx" .

# If found in active code, verify if still used
# Most should be in archived/ directory (safe)
```

### 4.2 Better Auth References

**Status:** ⚠️ Check Usage

**Files:**
```
package.json: "better-auth": "^1.0.0"
package.json: "@better-fetch/fetch": "^1.0.0"
```

**Action:**
```bash
# Check if better-auth is imported anywhere
grep -r "better-auth" --include="*.ts" --include="*.tsx" .

# If no imports found, remove:
npm uninstall better-auth @better-fetch/fetch
```

### 4.3 Dead Code Detection

**Recommended Tools:**

**1. TypeScript dead code detection:**
```bash
npx ts-prune
```

**2. Unused exports:**
```bash
npx unimported
```

**3. Circular dependencies:**
```bash
npx madge --circular --extensions ts,tsx .
```

**4. Large files (refactor candidates):**
```bash
find . -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | head -20
```

---

## 5. Recommendations

### 5.1 Critical (Must Fix)

1. **Remove all Appwrite residue**
   - Delete `platform/appwrite/` directory
   - Delete `lib/auth/appwriteServerActions.ts`
   - Update all auth files to use Supabase only
   - Remove from package.json
   - Clean .env files
   - **Estimated effort:** 1-2 days

2. **Consolidate duplicate catalog routes**
   - Merge 3 routes into 1 parameterized route
   - Reduce code duplication by ~300 lines
   - **Estimated effort:** 1 day

3. **Standardize auth middleware**
   - Create `withAuth` helper
   - Update all routes to use consistent pattern
   - Add role-based access control
   - **Estimated effort:** 2 days

### 5.2 High Priority

4. **Implement database migrations**
   - Set up Drizzle Kit
   - Generate initial migration from current schema
   - Document migration workflow
   - **Estimated effort:** 1 day

5. **Add missing database indexes**
   - Add indexes on foreign keys
   - Add composite indexes for common queries
   - Test query performance
   - **Estimated effort:** 0.5 days

6. **Standardize error responses**
   - Create ApiError class
   - Define error codes
   - Update all routes
   - **Estimated effort:** 1 day

### 5.3 Medium Priority

7. **Centralize input validation**
   - Create Zod schemas for all entities
   - Add validation middleware
   - Update all routes
   - **Estimated effort:** 2 days

8. **Implement soft deletes**
   - Add deleted_at columns
   - Update query helpers
   - Add restore functionality
   - **Estimated effort:** 1 day

9. **Add API versioning**
   - Move routes to /api/v1/
   - Document versioning strategy
   - **Estimated effort:** 1 day

10. **Audit and clean dependencies**
    - Remove unused packages
    - Update outdated packages
    - Lock critical versions
    - **Estimated effort:** 1 day

---

## 6. Implementation Priority

**Phase 1: Critical Cleanup (Week 1)**
- Day 1-2: Remove Appwrite residue
- Day 3: Consolidate catalog routes
- Day 4-5: Standardize auth middleware

**Phase 2: Database Improvements (Week 2)**
- Day 1: Set up Drizzle Kit migrations
- Day 2: Add missing indexes
- Day 3: Implement soft deletes
- Day 4-5: Testing and validation

**Phase 3: API Standardization (Week 3)**
- Day 1-2: Standardize error responses
- Day 3-4: Centralize input validation
- Day 5: Add API versioning

**Phase 4: Dependency Cleanup (Week 4)**
- Day 1: Audit dependencies
- Day 2: Remove unused packages
- Day 3: Update outdated packages
- Day 4-5: Testing and documentation

**Total Estimated Effort:** 4 weeks (1 developer)

---

## 7. Success Metrics

**After Implementation:**
- ✅ Zero Appwrite references in codebase
- ✅ Single parameterized catalog route (vs 3 duplicates)
- ✅ Consistent auth pattern across all routes
- ✅ Database migrations tracked in git
- ✅ All foreign keys indexed
- ✅ Standardized error responses
- ✅ Input validation on all endpoints
- ✅ No unused dependencies
- ✅ All dependencies up-to-date

**Quality Gates:**
- `npm run typecheck` passes
- `npm run lint` passes
- `npm test` passes
- `npm audit` shows 0 vulnerabilities
- `npx depcheck` shows 0 unused dependencies

---

## 8. Risk Assessment

**High Risk Changes:**
1. **Appwrite removal** - Could break auth if not fully migrated to Supabase
   - Mitigation: Test all auth flows thoroughly
   
2. **Database migrations** - Could cause data loss if done incorrectly
   - Mitigation: Backup database before migration, test on staging

3. **Route consolidation** - Could break API clients
   - Mitigation: Add redirect from old routes, document breaking changes

**Medium Risk Changes:**
1. **Auth middleware standardization** - Could introduce security gaps
   - Mitigation: Comprehensive testing, security review

2. **Dependency updates** - Could introduce breaking changes
   - Mitigation: Update one at a time, test after each update

**Low Risk Changes:**
1. **Adding indexes** - Performance improvement only
2. **Error response standardization** - Internal change
3. **Input validation** - Adds safety, doesn't break existing code

---

*Report generated as part of comprehensive codebase audit on 2026-06-20*
