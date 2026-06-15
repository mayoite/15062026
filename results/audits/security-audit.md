# Security Audit — oando-consolidated

Generated: 2025-01-XX (automated scan)

---

## CRITICAL

### 1. Hardcoded secret in `.env.example` (committed to repo)

**File:** `.env.example:83`

The `.env.example` file contains a real Appwrite secret key in a commented block:

```
#APPWRITE_DEV_SECRET_KEY=5a67afb7efd7bcdcc1823ac61c422333...c697111ac92ab
```

Even though commented, this is a **real 128-char secret committed to version control**. Anyone with repo access can extract it.

**Remediation:** Remove the value from `.env.example`. Rotate the Appwrite key immediately. Use BFG Repo-Cleaner to purge from history.

---

### 2. Weak / trivially-guessable admin tokens

**File:** `.env.local:3-4`

```
ADMIN_TOKEN=ayush@123
CUSTOMER_QUERIES_ADMIN_TOKEN=ayush@123
```

These tokens protect the `/api/customer-queries/manage` endpoint (which exposes customer PII: names, emails, phone numbers). The value `ayush@123` is trivially guessable and identical for both tokens.

**Remediation:** Use cryptographically random tokens (>=32 chars). Consider replacing static tokens with proper session-based auth.

---

### 3. Hardcoded Supabase fallback URL in source code

**File:** `platform/drizzle/db.ts:34`

```typescript
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://erpweaiypimorcunaimz.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);
```

The production Supabase project URL is hardcoded as a fallback. If env vars are missing, the app silently connects to this project with a placeholder key. This leaks infrastructure details.

**Remediation:** Fail loudly if env vars are missing. Remove hardcoded URLs.

---

## HIGH

### 4. Multiple API routes missing authentication entirely

| Route | Method | Auth | Rate Limit | Risk |
|-------|--------|------|------------|------|
| `app/api/admin/themes/publish/route.ts` | POST | **NONE** | **NONE** | Unauthenticated write to CDN (DO Spaces + Cloudflare R2) |
| `app/api/theme/manage/route.ts` | POST | **NONE** | **NONE** | Unauthenticated theme activation |
| `app/api/ai/advisor/route.ts` | POST | **NONE** | **NONE** | Open AI-mock endpoint |
| `app/api/planner/ai-advisor/route.ts` | POST | **NONE** | **NONE** | Open AI provider chain access |
| `app/api/audit/route.ts` | POST | **NONE** | **NONE** | Arbitrary audit event injection |
| `app/api/tracking/route.ts` | POST | **NONE** | **NONE** | Unauthenticated write to user_history via service-role client |
| `app/api/plans/route.ts` | POST | Session | **NONE** | No rate limit on plan publish |

**Most Critical:** `admin/themes/publish` allows **anyone** to overwrite theme JSON files on your CDN without authentication.

**Remediation:** Add `requireAdminSession()` + `enforceAdminRateLimit()` to all admin/write routes. Add rate limiting to all public POST routes.

---

### 5. `/api/customer-queries/manage` uses weak static token auth

**File:** `app/api/customer-queries/manage/route.ts:29-35`

```typescript
function isAuthorized(req: NextRequest): boolean {
  const required = process.env.CUSTOMER_QUERIES_ADMIN_TOKEN?.trim();
  if (!required) return false;
  const provided = req.headers.get("x-admin-token")?.trim() || "";
  return provided.length > 0 && provided === required;
}
```

This is a simple string comparison of a static token sent in a header. Combined with the weak token value (`ayush@123`), this endpoint (which exposes customer PII) is effectively unprotected. No rate limiting either.

**Remediation:** Replace with `requireAdminSession()`. Add rate limiting. Use timing-safe comparison if static tokens are kept.

---

### 6. `/api/tracking/route.ts` — service-role client used without auth

**File:** `app/api/tracking/route.ts:69-128`

The POST handler writes to `user_history` using `createSupabaseAuthAdminClient()` (service-role key) but has:
- No authentication requirement
- No rate limiting
- Accepts arbitrary `userId` from request body

An attacker can overwrite any user's `viewed_products` history or create entries for arbitrary user IDs.

**Remediation:** Add rate limiting. Validate that userId matches the authenticated session. Remove ability to set userId from body for unauthenticated requests.

---

## MEDIUM

### 7. Unvalidated `req.json()` writes — partial validation only

Several routes parse `req.json()` and pass fields to database operations with minimal schema validation:

| File | Line | Issue |
|------|------|-------|
| `app/api/audit/route.ts` | 6-8 | Body fields passed directly to `insertEvent()` — only checks presence, no type/length validation |
| `app/api/admin/themes/publish/route.ts` | 6 | `tokens` object written to CDN with no schema validation |
| `app/api/theme/manage/route.ts` | 37 | `request.json()` parsed, only `presetId` checked |
| `app/api/planner/ai-advisor/route.ts` | 38 | Body cast to interface with no runtime validation |
| `app/api/ai/advisor/route.ts` | 20 | Body cast to interface, only array check |

**Remediation:** Add schema validation (e.g., Zod) for all POST/PATCH/PUT request bodies before processing.

---

### 8. No rate limiting on several public endpoints

| Route | Method | Issue |
|-------|--------|-------|
| `app/api/categories/route.ts` | GET | No rate limit |
| `app/api/products/route.ts` | GET | No rate limit |
| `app/api/products/filter/route.ts` | GET | No rate limit |
| `app/api/nav-categories/route.ts` | GET | No rate limit |
| `app/api/business-stats/route.ts` | GET | No rate limit |
| `app/api/theme/active/route.ts` | GET | No rate limit |
| `app/api/plans/route.ts` | GET/POST | No rate limit |
| `app/api/dev-tools/lighthouse/route.ts` | GET | No rate limit (env-gated to non-prod) |

While GET endpoints are lower risk, they can be abused for scraping or DoS.

**Remediation:** Add basic rate limiting to all public API routes.

---

### 9. Service-role clients not leaked to client components PASS

All `createSupabaseAuthAdminClient`, `createAdminServiceClient`, and `createSupabaseAdminClient` imports are exclusively in:
- `app/api/` route handlers (server-only)
- `platform/supabase/` server modules
- `tools/scripts/` CLI tools
- `lib/rateLimit.ts` (server)

**No `'use client'` file imports any service-role client.** This check passes.

---

### 10. `platform/drizzle/db.ts` exports a public Supabase client at module scope

**File:** `platform/drizzle/db.ts:33-36`

```typescript
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://erpweaiypimorcunaimz.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);
```

This file is imported in `app/api/tracking/route.ts` — a server route that also imports the admin client. The anon-key client is harmless in isolation but creates confusion about which client has which privileges.

**Remediation:** Separate the Drizzle DB export from the Supabase anon client. Use distinct module files.

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 3 |
| High | 3 |
| Medium | 4 |

### Priority Actions

1. **Immediately rotate** all secrets visible in `.env.example` and scrub git history
2. **Add auth to `/api/admin/themes/publish`** — this allows unauthenticated CDN writes
3. **Strengthen admin tokens** — replace `ayush@123` with cryptographic randomness or session auth
4. **Add rate limiting** to `/api/tracking`, `/api/audit`, `/api/planner/ai-advisor`, `/api/ai/advisor`
5. **Add schema validation** (Zod) to all request body parsing
