# Security and Privacy Hardening Audit Report

**Audit Path:** `21062026/07-security-privacy-hardening.md`  
**Date:** June 21, 2026  
**Auditor:** Agent 3 (Security & Resilience Specialist)  

---

## Executive Scorecard

| Parameter | Description | Score (1-10) | Status |
|---|---|---|---|
| **31** | Cross-Site Scripting (XSS) prevention (sanitization of JSON-LD scripts, validation of user strings) | 7.5/10 | Needs Improvement |
| **32** | Cross-Site Request Forgery (CSRF) protection coverage across mutated API routes | 2.0/10 | Vulnerable |
| **33** | Supabase Row Level Security (RLS) enforcement verification on all database tables | 9.0/10 | Excellent |
| **34** | API route user session authentication and permission checking (e.g. admin vs customer authorization) | 8.0/10 | Good |
| **35** | API route rate-limiting and security headers coverage (CSP, HSTS, X-Frame-Options) | 6.5/10 | Needs Improvement |

**Overall Security & Privacy Score:** **6.6 / 10**

---

## Detailed Audit Findings & Recommendations

### Parameter 31: Cross-Site Scripting (XSS) Prevention
**Score:** 7.5 / 10

#### Findings
- **JSON-LD Script Sanitization:** The application successfully protects against XSS in dynamic SEO blocks using a centralized utility function [sanitizeJsonForScript](file:///e:/16062026/lib/security/sanitize.ts#L10-L15). This function is consistently called inside `dangerouslySetInnerHTML` script blocks across marketing, category, and product detail routes.
- **Active HTML Attribute Injection Vulnerability:** In the 3D model configurator layout [ProductViewer.tsx](file:///e:/16062026/app/%28site%29/products/%5Bcategory%5D/%5Bproduct%5D/ProductViewer.tsx#L570-L584), the `<model-viewer>` component is rendered via `dangerouslySetInnerHTML` with raw, unsanitized string interpolations of `modelPath` and `displayName` (derived from the product name). 
  - If a product display name contains double quotes (e.g., `Ergonomic Office Chair 24" Deluxe`), it breaks out of the HTML attribute block, permitting arbitrary attribute injection (e.g. `onload` or `onerror` handlers) leading to an XSS payload execution.

#### Citations
- Script sanitization helper: [sanitize.ts](file:///e:/16062026/lib/security/sanitize.ts#L10-L15)
- HTML attribute injection point: [ProductViewer.tsx](file:///e:/16062026/app/%28site%29/products/%5Bcategory%5D/%5Bproduct%5D/ProductViewer.tsx#L570-L584)
- XSS verification in category list: [CategoryPageView.tsx](file:///e:/16062026/app/%28site%29/products/%5Bcategory%5D/CategoryPageView.tsx#L71-L76)

#### Recommendations
- Avoid using `dangerouslySetInnerHTML` for the `<model-viewer>` tag. Instantiation of custom HTML elements can be handled directly in React with native props.
- If dynamic HTML insertion is required, implement strict attribute escaping or use a library like `dompurify` to sanitize all interpolated parameters (specifically `displayName` and `modelPath`) before generating the HTML string.

---

### Parameter 32: Cross-Site Request Forgery (CSRF) Protection
**Score:** 2.0 / 10

#### Findings
- **Dead CSRF Utilities:** The codebase contains a dedicated CSRF validation utility [csrf.ts](file:///e:/16062026/lib/security/csrf.ts) implementing the double-submit cookie pattern with timing-safe comparisons via `timingSafeEqual`.
- **Zero Enforcement:** This CSRF validation logic is **not imported or executed anywhere** in the entire codebase, neither in the API routes nor in the middleware.
- **Vulnerability on Mutated API Routes:** Mutating API endpoints (such as POST `/api/plans`) authenticate requests using the Supabase cookie session via `createServerClient()`. Because browser cookies are automatically attached to cross-origin requests, these routes are fully vulnerable to CSRF attacks. A malicious third-party site could trigger a POST payload to `/api/plans` to manipulate or delete plans on behalf of a logged-in user.

#### Citations
- Unused CSRF logic: [csrf.ts](file:///e:/16062026/lib/security/csrf.ts)
- Vulnerable mutating endpoint: [app/api/plans/route.ts](file:///e:/16062026/app/api/plans/route.ts#L63-L98)
- Vulnerable admin publishing endpoint: [app/api/admin/themes/publish/route.ts](file:///e:/16062026/app/api/admin/themes/publish/route.ts#L17)

#### Recommendations
- Standardize a middleware rule or hook (e.g. wrapping endpoints in a CSRF helper) to call `validateCsrfRequest(req)` on all incoming state-mutating requests (POST, PUT, DELETE, PATCH).
- Pass the CSRF token in a custom header (e.g. `X-CSRF-Token`) on all client-side data mutations, validating it against the corresponding HTTP-only cookie.

---

### Parameter 33: Supabase Row Level Security (RLS) Enforcement
**Score:** 9.0 / 10

#### Findings
- **RLS Enablement:** Row Level Security is enabled globally on all database tables via migration [20260524233839_enable_rls_and_policies.sql](file:///e:/16062026/platform/supabase/migrations/20260524233839_enable_rls_and_policies.sql).
- **Access Control Strategy:** 
  - Catalog tables are public-read and write-restricted to the service role.
  - Private tables (including `plans`, `quotes`, `clients`, `profiles`, and `teams`) have RLS enabled with service-role-only write/read access.
- **Service Role Bypass:** Backend service routes bypass RLS safely using the admin client created by [createSupabaseAdminClient](file:///e:/16062026/platform/supabase/admin.ts#L13-L36) which leverages the secret `SUPABASE_SERVICE_ROLE_KEY`.

#### Citations
- RLS migration script: [20260524233839_enable_rls_and_policies.sql](file:///e:/16062026/platform/supabase/migrations/20260524233839_enable_rls_and_policies.sql)
- Admin connection client: [admin.ts](file:///e:/16062026/platform/supabase/admin.ts#L13-L36)

#### Recommendations
- Maintain strict separation between public queries (running with user-specific privileges) and admin scripts.
- As user-facing dashboard features (like plan sharing, comments, or team collaboration) are introduced, write granular, row-level policies for the `plans` and `plan_shares` tables matching the active user session ID (instead of routing all queries through the service role).

---

### Parameter 34: API Session Authentication & Authorization
**Score:** 8.0 / 10

#### Findings
- **Role-Based Access Control (RBAC):** Admin endpoints are protected by the server-side helper [requireAdminSession](file:///e:/16062026/app/api/admin/_lib/server.ts#L59-L80) which checks user authenticity and role boundaries.
- **Verification Inconsistency:** 
  - The client UI checking layer [usePlannerSession.ts](file:///e:/16062026/features/planner/hooks/usePlannerSession.ts#L187-L198) verifies the user's role by querying the `profiles` database table directly.
  - The API route authorization helper [requireAdminSession](file:///e:/16062026/app/api/admin/_lib/server.ts#L71-L74) extracts the role from `user.app_metadata?.role` or `user.user_metadata?.role` inside the Supabase Auth JWT token.
  - If a user's role changes in the DB, the API authentication block will reject requests with 403 Forbidden until their auth token is re-issued or refreshed, as no trigger synchronizes the `profiles` database table role column back to the Supabase Auth metadata.

#### Citations
- Auth checker inside API: [server.ts](file:///e:/16062026/app/api/admin/_lib/server.ts#L59-L80)
- Client-side profiles check: [usePlannerSession.ts](file:///e:/16062026/features/planner/hooks/usePlannerSession.ts#L187-L198)
- Admin routes endpoint gating: [app/api/admin/plans/route.ts](file:///e:/16062026/app/api/admin/plans/route.ts#L25)

#### Recommendations
- Add a PostgreSQL database trigger to automatically update `auth.users.raw_app_meta_data` whenever the `role` column in the `public.profiles` table is modified.
- Standardize the authentication validation methodology to ensure both front-end and back-end utilize a singular source of truth for role state.

---

### Parameter 35: API Rate-Limiting & Security Headers
**Score:** 6.5 / 10

#### Findings
- **API Rate Limiting:** Individual endpoints implement localized rate-limiting using [rateLimit](file:///e:/16062026/lib/rateLimit.ts) based on client IPs (e.g. POST `/api/plans` allows 15 requests per minute; POST `/api/audit` allows 30 requests per minute).
- **Security Headers:** The edge proxy [proxy.ts](file:///e:/16062026/proxy.ts#L115-L135) injects standard security headers (including `Content-Security-Policy`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, and `Permissions-Policy`).
- **Critical Header Gap for API Routes:** The `matcher` config in `proxy.ts` explicitly excludes `/api/` routes. Consequently, none of the API routes are served with HSTS, CSP, clickjacking protection (`X-Frame-Options`), or MIME-sniffing protection (`X-Content-Type-Options`).
- **Weak CSP Directive:** The CSP script source configuration includes `script-src 'unsafe-inline' 'unsafe-eval'`. While necessary for development and certain analytics tools, it reduces XSS protection effectiveness.

#### Citations
- Proxy matcher exclusions: [proxy.ts](file:///e:/16062026/proxy.ts#L138-L153)
- Headers definition script: [proxy.ts](file:///e:/16062026/proxy.ts#L115-L135)
- Local rate-limiting usage: [plans/route.ts](file:///e:/16062026/app/api/plans/route.ts#L12-L37)

#### Recommendations
- Modify `proxy.ts` or add a dedicated API middleware to ensure security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`) are attached to all API route responses.
- In production, refactor CSP to use cryptographic nonces (`nonce-` token hashes) for inline scripts, removing `unsafe-inline` and `unsafe-eval`.
