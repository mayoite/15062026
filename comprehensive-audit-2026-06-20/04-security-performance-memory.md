# Report 04: Security + Performance + Memory

**Audit Date:** 2026-06-20  
**Auditor:** Agent D  
**Scope:** Security vulnerabilities, performance optimization, memory leaks, bundle analysis

---

## Executive Summary

The codebase has critical security issues including XSS vulnerabilities in JSON-LD injection, missing CSRF protection, and exposed environment variables. Performance is impacted by large bundle sizes (three.js, fabric), missing lazy loading, and inefficient rendering patterns. Memory leaks are present in useEffect hooks and event listeners without cleanup.

**Overall Scores:**
- Security: 55/100 (Critical Issues)
- Performance: 60/100 (Needs Improvement)
- Memory Management: 65/100 (Needs Improvement)

---

## 1. Security Audit

### 1.1 Cross-Site Scripting (XSS)

**Status:** ❌ Critical Vulnerabilities

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Critical | `app/(site)/layout.tsx` | 35 | `dangerouslySetInnerHTML` for JSON-LD | Sanitize JSON before injection |
| Critical | `app/(site)/page.tsx` | 37 | `dangerouslySetInnerHTML` for JSON-LD | Sanitize JSON before injection |
| High | `app/planner/(marketing)/features/[slug]/page.tsx` | 51 | `dangerouslySetInnerHTML` usage | Validate and sanitize content |
| High | `app/planner/(marketing)/features/page.tsx` | 30 | `dangerouslySetInnerHTML` usage | Validate and sanitize content |
| High | `app/planner/(marketing)/help/page.tsx` | 25 | `dangerouslySetInnerHTML` usage | Validate and sanitize content |
| High | `app/(site)/templates/page.tsx` | 28 | `dangerouslySetInnerHTML` usage | Validate and sanitize content |
| High | `app/(site)/products/[category]/[product]/page.tsx` | 338, 342 | `dangerouslySetInnerHTML` usage | Validate and sanitize content |
| High | `app/(site)/products/[category]/[product]/ProductViewer.tsx` | 570 | `dangerouslySetInnerHTML` usage | Validate and sanitize content |
| High | `app/(site)/products/[category]/CategoryPageView.tsx` | 70, 74 | `dangerouslySetInnerHTML` usage | Validate and sanitize content |
| High | `app/(site)/products/page.tsx` | 29 | `dangerouslySetInnerHTML` usage | Validate and sanitize content |
| High | `app/(site)/page.tsx` | 37 | `dangerouslySetInnerHTML` usage | Validate and sanitize content |
| Medium | `features/planner/catalog/CatalogBlockPreview.tsx` | 64 | `dangerouslySetInnerHTML` usage | Validate and sanitize content |
| Medium | `features/planner/catalog/renderBlockPrims.tsx` | 43 | `dangerouslySetInnerHTML` usage | Validate and sanitize content |
| Medium | `components/contact/ContactPageView.tsx` | 27 | `dangerouslySetInnerHTML` usage | Validate and sanitize content |

**Critical XSS Vulnerability:**
```typescript
// CURRENT (VULNERABLE):
// app/(site)/layout.tsx:35
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(GLOBAL_JSON_LD) }}
/>

// RECOMMENDED (SAFE):
import { sanitizeJsonForScript } from '@/lib/security/sanitize';

const safeJsonLd = sanitizeJsonForScript(GLOBAL_JSON_LD);

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: safeJsonLd }}
/>

// lib/security/sanitize.ts
export function sanitizeJsonForScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027')
    .replace(/"/g, '\\u0022');
}
```

### 1.2 CSRF Protection

**Status:** ❌ Missing Implementation

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Critical | All API routes | N/A | No CSRF tokens in forms | Add CSRF protection middleware |
| Critical | `app/api/customer-queries/route.ts` | N/A | Public form submission without CSRF | Add CSRF token validation |
| High | `app/api/tracking/route.ts` | N/A | Tracking endpoint without CSRF | Add CSRF protection |
| High | `app/api/recommendations/route.ts` | N/A | Recommendations without CSRF | Add CSRF protection |
| Medium | `app/api/audit/route.ts` | N/A | Audit logging without CSRF | Add CSRF protection |

**Recommended Fix:**
```typescript
// lib/security/csrf.ts
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

export async function validateCsrfToken(token: string): Promise<boolean> {
  const cookieStore = await cookies();
  const storedToken = cookieStore.get('csrf_token')?.value;
  
  if (!storedToken || !token) {
    return false;
  }
  
  // Constant-time comparison
  if (storedToken.length !== token.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < storedToken.length; i++) {
    result |= storedToken.charCodeAt(i) ^ token.charCodeAt(i);
  }
  
  return result === 0;
}

// Middleware for API routes
import { NextRequest, NextResponse } from 'next/server';
import { validateCsrfToken } from '@/lib/security/csrf';

export async function withCsrfProtection(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const token = req.headers.get('x-csrf-token');
  
  if (!token || !(await validateCsrfToken(token))) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }
  
  return handler(req);
}

// Usage in API routes
export const POST = async (req: NextRequest) => {
  return withCsrfProtection(req, async (req) => {
    // Route implementation
  });
};
```

### 1.3 Input Validation

**Status:** ⚠️ Inconsistent Implementation

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `app/api/customer-queries/route.ts` | N/A | Form input not validated with Zod | Add Zod schema validation |
| High | `app/api/tracking/route.ts` | N/A | Tracking data not validated | Add Zod schema validation |
| High | `app/api/recommendations/route.ts` | N/A | Recommendations params not validated | Add Zod schema validation |
| Medium | `app/api/audit/route.ts` | N/A | Audit data not validated | Add Zod schema validation |
| Medium | `app/api/admin/features/route.ts` | N/A | Feature flags not validated | Add Zod schema validation |
| Medium | `app/api/admin/themes/publish/route.ts` | N/A | Theme data not validated | Add Zod schema validation |

**Recommended Fix:**
```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

export const CustomerQuerySchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(20).optional(),
  message: z.string().min(1).max(5000),
  productInterest: z.string().max(200).optional(),
});

export const TrackingEventSchema = z.object({
  event: z.string().min(1).max(100),
  productId: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const RecommendationRequestSchema = z.object({
  category: z.string().max(100).optional(),
  limit: z.number().min(1).max(20).optional(),
  excludeIds: z.array(z.string()).optional(),
});

// Usage in API routes
import { CustomerQuerySchema } from '@/lib/validation/schemas';

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const validated = CustomerQuerySchema.parse(body);
    
    // Process validated data
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    throw error;
  }
};
```

### 1.4 Authentication & Authorization

**Status:** ⚠️ Needs Improvement

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `app/api/admin/*` | N/A | Admin routes check session but no role verification | Add role-based access control |
| High | `app/api/customer-queries/manage/route.ts` | N/A | Management endpoint without proper auth | Add authentication |
| Medium | `app/api/audit/route.ts` | N/A | Audit endpoint accessible without proper auth | Add authentication |
| Medium | `app/api/admin/themes/publish/route.ts` | N/A | Theme publishing without proper auth | Add authentication |
| Medium | `app/api/admin/features/route.ts` | N/A | Feature flag management without proper auth | Add authentication |

**Recommended Fix:**
```typescript
// lib/auth/rbac.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export type Role = 'admin' | 'editor' | 'viewer';

export async function withRoleCheck(
  req: NextRequest,
  requiredRole: Role,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  const roleHierarchy: Record<Role, number> = {
    viewer: 1,
    editor: 2,
    admin: 3,
  };
  
  if (roleHierarchy[session.role] < roleHierarchy[requiredRole]) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }
  
  return handler(req);
}

// Usage in API routes
export const POST = async (req: NextRequest) => {
  return withRoleCheck(req, 'admin', async (req) => {
    // Admin-only route implementation
  });
};
```

### 1.5 Environment Variable Exposure

**Status:** ❌ Critical Issues

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Critical | `lib/env.server.ts` | 21-22 | Server-only env vars might be exposed | Use NEXT_PUBLIC_ prefix correctly |
| Critical | `platform/supabase/env.ts` | 15-16, 27-28 | Supabase credentials in env | Ensure service role key is server-only |
| Critical | `platform/supabase/admin.ts` | 14, 18-19, 23 | Admin credentials in env | Ensure service role key is server-only |
| High | `config/build/next.config.js` | 2-6 | SITE_URL in config | Ensure no secrets in client bundle |
| High | `platform/drizzle/db.ts` | 16, 38-39, 46-48, 51, 53 | Database credentials in env | Ensure DATABASE_URL is server-only |
| Medium | `app/api/admin/_lib/server.ts` | 10-11, 13 | Admin credentials in env | Ensure service role key is server-only |
| Medium | `app/api/admin/themes/publish/route.ts` | 38, 50, 54, 78, 84-85, 90, 108 | CDN credentials in env | Ensure credentials are server-only |

**Recommended Fix:**
```typescript
// lib/config/env.ts
import { z } from 'zod';

// Client-side environment variables (safe to expose)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
});

// Server-side environment variables (NEVER expose to client)
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  CDN_ACCESS_KEY: z.string().optional(),
  CDN_SECRET_KEY: z.string().optional(),
});

export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export const serverEnv = serverEnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  CDN_ACCESS_KEY: process.env.CDN_ACCESS_KEY,
  CDN_SECRET_KEY: process.env.CDN_SECRET_KEY,
});

// Ensure server-only file
// lib/config/env.server.ts
import 'server-only';
export { serverEnv } from './env';
```

### 1.6 Rate Limiting

**Status:** ⚠️ Inconsistent Implementation

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `app/api/customer-queries/route.ts` | N/A | No rate limiting on form submission | Add rate limiting |
| High | `app/api/tracking/route.ts` | N/A | No rate limiting on tracking | Add rate limiting |
| Medium | `app/api/recommendations/route.ts` | N/A | No rate limiting on recommendations | Add rate limiting |
| Medium | `app/api/audit/route.ts` | N/A | No rate limiting on audit | Add rate limiting |
| Medium | `app/api/admin/features/route.ts` | N/A | No rate limiting on feature flags | Add rate limiting |

**Recommended Fix:**
```typescript
// lib/security/rateLimit.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface RateLimitConfig {
  limit: number;
  window: number; // in seconds
  keyPrefix: string;
}

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ success: boolean; remaining: number }> {
  const key = `${config.keyPrefix}:${identifier}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, config.window);
  }
  
  const remaining = Math.max(0, config.limit - current);
  
  return {
    success: current <= config.limit,
    remaining,
  };
}

// Middleware for API routes
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/security/rateLimit';

export async function withRateLimit(
  req: NextRequest,
  config: RateLimitConfig,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const identifier = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
  
  const result = await rateLimit(identifier, config);
  
  if (!result.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': config.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'Retry-After': config.window.toString(),
        },
      }
    );
  }
  
  return handler(req);
}

// Usage in API routes
export const POST = async (req: NextRequest) => {
  return withRateLimit(
    req,
    { limit: 10, window: 60, keyPrefix: 'customer-queries' },
    async (req) => {
      // Route implementation
    }
  );
};
```

---

## 2. Performance Audit

### 2.1 Bundle Size Analysis

**Status:** ❌ Critical Issues

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Critical | `package.json` | N/A | `three` dependency (~600KB) | Dynamic import only when needed |
| Critical | `package.json` | N/A | `fabric` dependency (~300KB) | Dynamic import only on planner route |
| High | `package.json` | N/A | `@react-three/fiber` (~150KB) | Dynamic import with three.js |
| High | `package.json` | N/A | `@react-three/drei` (~200KB) | Dynamic import with three.js |
| High | `package.json` | N/A | `motion` (framer-motion, ~150KB) | Already optimized via `optimizePackageImports` |
| Medium | `package.json` | N/A | `@supabase/supabase-js` (~100KB) | Tree-shake unused features |
| Medium | `package.json` | N/A | `drizzle-orm` (~50KB) | Tree-shake unused features |
| Medium | `package.json` | N/A | `openai` (~80KB) | Dynamic import only when needed |
| Medium | `package.json` | N/A | `pdfjs-dist` (~200KB) | Dynamic import only on PDF view |
| Low | `package.json` | N/A | `lucide-react` (~100KB) | Already optimized via `optimizePackageImports` |

**Recommended Fix:**
```typescript
// Dynamic import for heavy dependencies
// components/ThreeViewer.tsx
import dynamic from 'next/dynamic';

const ThreeScene = dynamic(() => import('./ThreeScene'), {
  ssr: false,
  loading: () => <div>Loading 3D viewer...</div>,
});

export function ThreeViewer() {
  return <ThreeScene />;
}

// features/planner/canvas-fabric/FabricCanvas.tsx
import dynamic from 'next/dynamic';

const FabricCanvasInner = dynamic(() => import('./FabricCanvasInner'), {
  ssr: false,
  loading: () => <div>Loading canvas...</div>,
});

export function FabricCanvas() {
  return <FabricCanvasInner />;
}

// features/planner/pdf/PdfViewer.tsx
import dynamic from 'next/dynamic';

const PdfViewerInner = dynamic(() => import('./PdfViewerInner'), {
  ssr: false,
  loading: () => <div>Loading PDF viewer...</div>,
});

export function PdfViewer() {
  return <PdfViewerInner />;
}
```

### 2.2 Code Splitting

**Status:** ⚠️ Needs Improvement

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `app/(site)/layout.tsx` | N/A | All routes share same bundle | Add route-based code splitting |
| High | `app/planner/` | N/A | Planner bundle includes entire app | Isolate planner bundle |
| High | `app/admin/` | N/A | Admin bundle includes entire app | Isolate admin bundle |
| Medium | `components/ThreeViewer.tsx` | N/A | Three.js loaded on all pages | Dynamic import |
| Medium | `features/planner/canvas-fabric/FloorplanCanvas.tsx` | N/A | Fabric loaded on all pages | Dynamic import |
| Medium | `features/planner/pdf/PdfViewer.tsx` | N/A | PDF.js loaded on all pages | Dynamic import |

**Recommended Fix:**
```typescript
// Route-based code splitting is automatic in Next.js App Router
// But we need to ensure heavy components are dynamically imported

// app/planner/layout.tsx
import { PlannerProvider } from '@/features/planner/context';

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlannerProvider>
      {children}
    </PlannerProvider>
  );
}

// app/admin/layout.tsx
import { AdminProvider } from '@/features/admin/context';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      {children}
    </AdminProvider>
  );
}

// Ensure heavy components are dynamically imported
// components/ProductGallery.tsx
import dynamic from 'next/dynamic';

const ThreeViewer = dynamic(() => import('./ThreeViewer'), {
  ssr: false,
  loading: () => <div>Loading 3D viewer...</div>,
});

export function ProductGallery({ product }: { product: Product }) {
  const [show3D, setShow3D] = useState(false);
  
  return (
    <div>
      {/* 2D images */}
      {show3D && <ThreeViewer model={product.modelUrl} />}
    </div>
  );
}
```

### 2.3 Image Optimization

**Status:** ⚠️ Needs Improvement

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `components/ProductGallery.tsx` | N/A | Images not using Next.js Image | Use next/image for optimization |
| High | `components/home/ShowcaseCarousel.tsx` | N/A | Images not optimized | Use next/image |
| High | `components/home/FeaturedCarousel.tsx` | N/A | Images not optimized | Use next/image |
| Medium | `components/site/Header.tsx` | N/A | Logo not optimized | Use next/image |
| Medium | `components/home/Collections.tsx` | N/A | Collection images not optimized | Use next/image |
| Medium | `features/planner/catalog/CatalogBlockPreview.tsx` | N/A | Catalog images not optimized | Use next/image |

**Recommended Fix:**
```typescript
// components/ProductGallery.tsx
import Image from 'next/image';

export function ProductGallery({ product }: { product: Product }) {
  return (
    <div className="relative aspect-square">
      <Image
        src={product.imageUrl}
        alt={product.name}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority={product.isFeatured}
        className="object-cover"
      />
    </div>
  );
}

// components/home/ShowcaseCarousel.tsx
import Image from 'next/image';

export function ShowcaseCarousel({ items }: { items: ShowcaseItem[] }) {
  return (
    <div className="relative h-[400px]">
      {items.map((item) => (
        <div key={item.id} className="relative w-full h-full">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
```

### 2.4 Rendering Optimization

**Status:** ⚠️ Needs Improvement

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `features/planner/editor/PlannerWorkspace.tsx` | 131-173 | Multiple useEffect hooks cause re-renders | Consolidate effects; use useMemo |
| High | `features/site-assistant/UnifiedAssistant.tsx` | 190-419 | Complex state management | Use useReducer for complex state |
| Medium | `components/site/Header.tsx` | 113-257 | Scroll-based re-renders | Use useCallback for handlers |
| Medium | `components/home/ShowcaseCarousel.tsx` | 95-161 | Carousel re-renders on every slide | Use React.memo |
| Medium | `components/home/FeaturedCarousel.tsx` | 64-164 | Carousel re-renders on every slide | Use React.memo |
| Low | `components/ui/Modal.tsx` | 37-38 | Modal re-renders on state change | Use React.memo |

**Recommended Fix:**
```typescript
// features/planner/editor/PlannerWorkspace.tsx
import { memo, useMemo, useCallback } from 'react';

export const PlannerWorkspace = memo(function PlannerWorkspace() {
  const [state, dispatch] = useReducer(plannerReducer, initialState);
  
  // Memoize expensive computations
  const filteredItems = useMemo(() => {
    return state.items.filter(item => item.visible);
  }, [state.items]);
  
  // Memoize event handlers
  const handleItemClick = useCallback((id: string) => {
    dispatch({ type: 'SELECT_ITEM', payload: id });
  }, []);
  
  return (
    <div>
      {/* Use memoized values */}
      {filteredItems.map(item => (
        <Item key={item.id} item={item} onClick={handleItemClick} />
      ))}
    </div>
  );
});

// components/home/ShowcaseCarousel.tsx
import { memo } from 'react';

export const ShowcaseCarousel = memo(function ShowcaseCarousel({ items }: { items: ShowcaseItem[] }) {
  // Component implementation
});

// components/ui/Modal.tsx
import { memo } from 'react';

export const Modal = memo(function Modal({ isOpen, onClose, children }: ModalProps) {
  // Component implementation
});
```

### 2.5 Caching Strategy

**Status:** ⚠️ Partial Implementation

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `app/api/products/route.ts` | N/A | No caching on product API | Add cache headers |
| High | `app/api/categories/route.ts` | N/A | No caching on categories API | Add cache headers |
| High | `app/api/recommendations/route.ts` | N/A | No caching on recommendations | Add cache headers |
| Medium | `app/api/nav-search/route.ts` | N/A | No caching on search | Add cache headers |
| Medium | `app/api/filter/route.ts` | N/A | No caching on filter | Add cache headers |
| Medium | `app/api/admin/features/route.ts` | N/A | No caching on feature flags | Add cache headers |

**Recommended Fix:**
```typescript
// app/api/products/route.ts
import { NextResponse } from 'next/server';

export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  const products = await getProducts();
  
  return NextResponse.json(products, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  });
}

// app/api/categories/route.ts
export const revalidate = 86400; // Revalidate every 24 hours

export async function GET() {
  const categories = await getCategories();
  
  return NextResponse.json(categories, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
    },
  });
}

// app/api/recommendations/route.ts
export const revalidate = 1800; // Revalidate every 30 minutes

export async function GET() {
  const recommendations = await getRecommendations();
  
  return NextResponse.json(recommendations, {
    headers: {
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
    },
  });
}
```

---

## 3. Memory Leak Audit

### 3.1 useEffect Cleanup

**Status:** ❌ Critical Issues

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Critical | `features/planner/editor/PlannerWorkspace.tsx` | 131-173 | Multiple useEffect without cleanup | Add cleanup functions |
| Critical | `features/site-assistant/UnifiedAssistant.tsx` | 190-419 | Event listeners not cleaned up | Add cleanup functions |
| High | `components/site/Header.tsx` | 113-257 | Scroll listeners not cleaned up | Add cleanup functions |
| High | `components/home/ShowcaseCarousel.tsx` | 95-161 | Interval not cleaned up | Add cleanup functions |
| High | `components/home/FeaturedCarousel.tsx` | 64-164 | Interval not cleaned up | Add cleanup functions |
| Medium | `components/ui/Modal.tsx` | 37-38 | Event listeners not cleaned up | Add cleanup functions |
| Medium | `features/planner/canvas-fabric/FloorplanCanvas.tsx` | 72-78 | Canvas not cleaned up | Add cleanup functions |
| Medium | `features/planner/3d/Planner3DViewer.tsx` | 403-415 | WebGL context not cleaned up | Add cleanup functions |

**Recommended Fix:**
```typescript
// features/planner/editor/PlannerWorkspace.tsx
import { useEffect } from 'react';

export function PlannerWorkspace() {
  useEffect(() => {
    const handleResize = () => {
      // Handle resize
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      // Periodic update
    }, 1000);
    
    // Cleanup function
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  useEffect(() => {
    const controller = new AbortController();
    
    fetch('/api/data', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        // Handle data
      });
    
    // Cleanup function
    return () => {
      controller.abort();
    };
  }, []);
  
  return <div>...</div>;
}

// features/site-assistant/UnifiedAssistant.tsx
export function UnifiedAssistant() {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle message
    };
    
    window.addEventListener('message', handleMessage);
    
    // Cleanup function
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  return <div>...</div>;
}

// components/home/ShowcaseCarousel.tsx
export function ShowcaseCarousel() {
  useEffect(() => {
    const interval = setInterval(() => {
      // Auto-advance carousel
    }, 5000);
    
    // Cleanup function
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  return <div>...</div>;
}

// features/planner/canvas-fabric/FloorplanCanvas.tsx
export function FloorplanCanvas() {
  useEffect(() => {
    const canvas = new fabric.Canvas('canvas');
    
    // Setup canvas
    
    // Cleanup function
    return () => {
      canvas.dispose();
    };
  }, []);
  
  return <canvas id="canvas" />;
}

// features/planner/3d/Planner3DViewer.tsx
export function Planner3DViewer() {
  useEffect(() => {
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer();
    
    // Setup scene
    
    // Cleanup function
    return () => {
      renderer.dispose();
      scene.clear();
    };
  }, []);
  
  return <div ref={containerRef} />;
}
```

### 3.2 Event Listener Cleanup

**Status:** ❌ Critical Issues

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Critical | `features/site-assistant/UnifiedAssistant.tsx` | 190-419 | Multiple event listeners without cleanup | Add cleanup functions |
| High | `components/site/Header.tsx` | 113-257 | Scroll and resize listeners without cleanup | Add cleanup functions |
| High | `components/home/ShowcaseCarousel.tsx` | 95-161 | Keyboard listeners without cleanup | Add cleanup functions |
| High | `components/home/FeaturedCarousel.tsx` | 64-164 | Keyboard listeners without cleanup | Add cleanup functions |
| Medium | `components/ui/Modal.tsx` | 37-38 | Keyboard listeners without cleanup | Add cleanup functions |
| Medium | `lib/ui/Tooltip.tsx` | 34, 40 | Mouse listeners without cleanup | Add cleanup functions |

**Recommended Fix:**
```typescript
// components/site/Header.tsx
import { useEffect } from 'react';

export function Header() {
  useEffect(() => {
    const handleScroll = () => {
      // Handle scroll
    };
    
    const handleResize = () => {
      // Handle resize
    };
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    // Cleanup function
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return <header>...</header>;
}

// components/ui/Modal.tsx
export function Modal({ isOpen, onClose }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return <div>...</div>;
}

// lib/ui/Tooltip.tsx
export function Tooltip({ children, content }: TooltipProps) {
  useEffect(() => {
    const handleMouseEnter = () => {
      // Show tooltip
    };
    
    const handleMouseLeave = () => {
      // Hide tooltip
    };
    
    const element = ref.current;
    if (element) {
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
    }
    
    // Cleanup function
    return () => {
      if (element) {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);
  
  return <div ref={ref}>{children}</div>;
}
```

### 3.3 Subscription Cleanup

**Status:** ⚠️ Needs Improvement

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `features/planner/store/plannerStore.ts` | N/A | Zustand store subscriptions not cleaned up | Add cleanup functions |
| High | `features/planner/store/plannerProjectStore.ts` | N/A | Store subscriptions not cleaned up | Add cleanup functions |
| Medium | `features/planner/store/plannerUIStore.ts` | N/A | Store subscriptions not cleaned up | Add cleanup functions |
| Medium | `features/planner/store/plannerHistoryStore.ts` | N/A | Store subscriptions not cleaned up | Add cleanup functions |
| Medium | `features/planner/store/plannerGeometryStore.ts` | N/A | Store subscriptions not cleaned up | Add cleanup functions |

**Recommended Fix:**
```typescript
// features/planner/store/plannerStore.ts
import { useEffect } from 'react';
import { usePlannerStore } from './plannerStore';

export function usePlannerSubscription() {
  useEffect(() => {
    const unsubscribe = usePlannerStore.subscribe((state) => {
      // Handle state changes
    });
    
    // Cleanup function
    return () => {
      unsubscribe();
    };
  }, []);
}

// Usage in component
export function PlannerComponent() {
  usePlannerSubscription();
  
  return <div>...</div>;
}
```

---

## 4. Prioritized Action Items

### Critical
1. **Fix XSS vulnerabilities** — Sanitize all `dangerouslySetInnerHTML` usage
2. **Add CSRF protection** — Implement CSRF tokens for all forms
3. **Fix environment variable exposure** — Ensure server-only vars are not exposed
4. **Fix useEffect cleanup** — Add cleanup functions to all effects
5. **Fix event listener cleanup** — Remove listeners on unmount

### High Priority
6. **Add input validation** — Use Zod schemas for all API inputs
7. **Add authentication** — Protect all admin and management endpoints
8. **Add rate limiting** — Implement rate limiting for all public endpoints
9. **Dynamic import heavy dependencies** — three.js, fabric, PDF.js
10. **Fix subscription cleanup** — Unsubscribe from stores on unmount

### Medium Priority
11. **Optimize images** — Use next/image for all images
12. **Add code splitting** — Isolate planner and admin bundles
13. **Optimize rendering** — Use React.memo and useMemo
14. **Add caching** — Implement cache headers for API routes
15. **Add role-based access control** — Implement RBAC for admin routes

### Low Priority
16. **Add security headers** — Implement CSP, HSTS, etc.
17. **Add bundle analysis** — Regular bundle size monitoring
18. **Add performance monitoring** — Track Core Web Vitals
19. **Add memory profiling** — Regular memory leak detection
20. **Document security practices** — Create security guidelines

---

## 5. Testing Recommendations

### Security Tests
```typescript
// tests/security/xss.test.ts
import { sanitizeJsonForScript } from '@/lib/security/sanitize';

describe('XSS Prevention', () => {
  it('should sanitize JSON for script injection', () => {
    const malicious = { data: '<script>alert("xss")</script>' };
    const sanitized = sanitizeJsonForScript(malicious);
    
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('\\u003cscript\\u003e');
  });
});

// tests/security/csrf.test.ts
import { generateCsrfToken, validateCsrfToken } from '@/lib/security/csrf';

describe('CSRF Protection', () => {
  it('should generate and validate CSRF token', async () => {
    const token = generateCsrfToken();
    const isValid = await validateCsrfToken(token);
    
    expect(isValid).toBe(true);
  });
  
  it('should reject invalid CSRF token', async () => {
    const isValid = await validateCsrfToken('invalid-token');
    
    expect(isValid).toBe(false);
  });
});
```

### Memory Leak Tests
```typescript
// tests/memory/useEffectCleanup.test.tsx
import { render, unmountComponentAtNode } from 'react-dom';
import { PlannerWorkspace } from '@/features/planner/editor/PlannerWorkspace';

describe('Memory Leak Prevention', () => {
  let container: HTMLDivElement;
  
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });
  
  afterEach(() => {
    unmountComponentAtNode(container);
    container.remove();
  });
  
  it('should clean up event listeners on unmount', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    render(<PlannerWorkspace />, container);
    unmountComponentAtNode(container);
    
    expect(addEventListenerSpy).toHaveBeenCalled();
    expect(removeEventListenerSpy).toHaveBeenCalled();
  });
});
```

---

**Report Generated:** 2026-06-20T02:51Z  
**Next Audit Recommended:** After critical security fixes (1 week)
