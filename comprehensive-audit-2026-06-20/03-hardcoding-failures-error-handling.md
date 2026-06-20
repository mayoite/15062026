# Report 03: Hardcoding + Failures + Error Handling

**Audit Date:** 2026-06-20  
**Auditor:** Agent D  
**Scope:** Hardcoded values, magic numbers, error boundaries, failure modes, graceful degradation

---

## Executive Summary

The codebase has significant hardcoding issues across configuration, API endpoints, business logic, and UI strings. Error handling is inconsistent with missing global error boundaries and inadequate fallback UI. Graceful degradation patterns are partially implemented but need strengthening.

**Overall Scores:**
- Hardcoding Issues: 45/100 (Critical)
- Error Handling: 60/100 (Needs Improvement)
- Graceful Degradation: 65/100 (Needs Improvement)

---

## 1. Hardcoding Audit

### 1.1 Configuration & Environment Variables

**Status:** ❌ Critical Issues

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Critical | `lib/env.server.ts` | 21-22 | Hardcoded environment variable names | Use centralized env config |
| Critical | `platform/supabase/env.ts` | 15-16, 27-28 | Hardcoded Supabase env var names | Centralize env configuration |
| Critical | `platform/supabase/admin.ts` | 14, 18-19, 23 | Hardcoded Supabase credentials | Use env abstraction layer |
| High | `config/build/next.config.js` | 2-6 | Multiple fallback env vars for SITE_URL | Simplify to single source of truth |
| High | `lib/siteUrl.ts` | 1 | Hardcoded site URL logic | Centralize URL configuration |
| High | `platform/drizzle/db.ts` | 16, 38-39, 46-48, 51, 53 | Hardcoded DATABASE_URL and Supabase env vars | Use env abstraction |
| Medium | `app/api/admin/_lib/server.ts` | 10-11, 13 | Hardcoded Supabase env vars | Use centralized config |
| Medium | `app/api/admin/themes/publish/route.ts` | 38, 50, 54, 78, 84-85, 90, 108 | Hardcoded CDN/S3 credentials | Use env abstraction |
| Medium | `features/crm/businessStats.ts` | 64 | Hardcoded business logic constants | Extract to config file |
| Low | `lib/assetPaths.ts` | 5-6, 27, 29, 32, 45 | Hardcoded asset paths | Use centralized path config |

**Recommended Fix:**
```typescript
// lib/config/env.ts
export const env = {
  site: {
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    name: process.env.NEXT_PUBLIC_SITE_NAME || 'Oando',
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  cdn: {
    endpoint: process.env.CDN_ENDPOINT,
    bucket: process.env.CDN_BUCKET,
  },
} as const;

// Validate required env vars
export function validateEnv() {
  const required = ['NEXT_PUBLIC_SITE_URL', 'DATABASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
```

### 1.2 API Endpoints & URLs

**Status:** ❌ Critical Issues

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Critical | `lib/ai/providerChain.ts` | 192, 212 | Hardcoded API endpoints for AI providers | Use env config |
| Critical | `app/api/nav-search/route.ts` | 175, 193, 237 | Hardcoded OpenRouter API URL | Use env config |
| Critical | `app/api/filter/route.ts` | 151, 157 | Hardcoded OpenAI/OpenRouter URLs | Use env config |
| High | `app/api/generate-alt/route.ts` | 230, 236 | Hardcoded OpenAI/OpenRouter URLs | Use env config |
| High | `features/planner/lib/aiService.ts` | 154, 212, 255 | Hardcoded AI service endpoints | Use env config |
| High | `features/planner/persistence/plannerCloudApi.ts` | 44, 63, 113, 149, 181 | Hardcoded API endpoints | Use env config |
| Medium | `lib/hooks/useRecommendations.ts` | 1, 32, 36 | Hardcoded API paths | Use API client abstraction |
| Medium | `features/site-assistant/UnifiedAssistant.tsx` | 239, 314 | Hardcoded API endpoints | Use API client |
| Medium | `components/site/Header.tsx` | 64, 146, 226 | Hardcoded navigation URLs | Use route config |
| Low | `lib/theme/useThemeAdmin.ts` | 41, 55, 80 | Hardcoded theme API paths | Use API client |

**Recommended Fix:**
```typescript
// lib/api/client.ts
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || '/api') {
    this.baseUrl = baseUrl;
  }

  async get<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      method: 'GET',
    });
    if (!response.ok) throw new ApiError(response);
    return response.json();
  }

  async post<T>(path: string, body: unknown, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new ApiError(response);
    return response.json();
  }
}

export const apiClient = new ApiClient();
```

### 1.3 Business Logic & Constants

**Status:** ⚠️ Needs Improvement

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `features/planner/lib/featureFlags.ts` | 168, 176, 197, 205, 213, 219, 228, 231, 233, 246, 248, 448 | Hardcoded feature flag defaults | Extract to config file |
| High | `features/planner/store/plannerProjectStore.ts` | 1, 32 | Hardcoded project limits | Use config constants |
| High | `lib/store/quoteCart.ts` | 3, 4, 28 | Hardcoded cart limits | Extract to config |
| High | `lib/store/productCompare.ts` | 3, 4, 26 | Hardcoded compare limits | Extract to config |
| Medium | `features/planner/lib/versioning.ts` | 4, 7, 35, 58, 64, 88, 97, 115, 253 | Hardcoded version constants | Use config |
| Medium | `features/planner/store/offlineStorage.ts` | 81 | Hardcoded storage keys | Use constants file |
| Medium | `data/site/routeCopy.ts` | 922, 928, 935 | Hardcoded content strings | Use CMS or i18n |
| Low | `features/planner/editor/plannerToolVisibility.ts` | 70, 78 | Hardcoded tool visibility rules | Extract to config |

**Recommended Fix:**
```typescript
// lib/config/constants.ts
export const PLANNER_CONFIG = {
  maxSeats: 100,
  maxRooms: 20,
  maxFurnitureItems: 500,
  defaultRoomWidth: 5000,
  defaultRoomHeight: 4000,
  minRoomSize: 2000,
  maxRoomSize: 20000,
} as const;

export const CART_CONFIG = {
  maxItems: 50,
  maxQuantityPerItem: 999,
  defaultCurrency: 'INR',
} as const;

export const COMPARE_CONFIG = {
  maxProducts: 4,
  minProducts: 2,
} as const;
```

### 1.4 UI Strings & Content

**Status:** ⚠️ Needs Improvement

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `components/site/Header.tsx` | 358-655 | Hardcoded navigation labels | Use i18n or content config |
| High | `components/site/MobileNavDrawer.tsx` | 58-387 | Hardcoded navigation content | Use content config |
| High | `components/home/Collections.tsx` | 37-99 | Hardcoded collection names | Use CMS or content config |
| Medium | `components/home/HomeFAQ.tsx` | 40-61 | Hardcoded FAQ content | Use CMS |
| Medium | `components/home/ShowcaseCarousel.tsx` | 95-161 | Hardcoded showcase content | Use CMS |
| Medium | `components/home/FeaturedCarousel.tsx` | 64-164 | Hardcoded featured content | Use CMS |
| Low | `components/ui/Button.tsx` | 28-29 | Hardcoded button labels | Use i18n |

**Recommended Fix:**
```typescript
// data/content/navigation.ts
export const NAV_ITEMS = {
  main: [
    { label: 'Products', href: '/products' },
    { label: 'Solutions', href: '/solutions' },
    { label: 'Planner', href: '/planner' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  footer: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Refund Policy', href: '/refund-policy' },
  ],
} as const;
```

### 1.5 Magic Numbers

**Status:** ❌ Critical Issues

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Critical | `features/planner/canvas-fabric/FloorplanCanvas.tsx` | 72-78 | Magic numbers for canvas dimensions | Use named constants |
| Critical | `features/planner/3d/Planner3DViewer.tsx` | 403-415 | Magic numbers for 3D camera positions | Use named constants |
| High | `features/planner/editor/PlannerWorkspace.tsx` | 131-173 | Magic numbers for layout dimensions | Use config constants |
| High | `components/home/ShowcaseCarousel.tsx` | 95-161 | Magic numbers for carousel timing | Use named constants |
| High | `components/home/FeaturedCarousel.tsx` | 64-164 | Magic numbers for carousel timing | Use named constants |
| Medium | `features/site-assistant/UnifiedAssistant.tsx` | 190-419 | Magic numbers for animation durations | Use theme constants |
| Medium | `components/site/Header.tsx` | 113-257 | Magic numbers for scroll thresholds | Use named constants |
| Medium | `lib/ui/Tooltip.tsx` | 34, 40 | Magic numbers for tooltip positioning | Use constants |
| Low | `components/ui/Modal.tsx` | 37-38 | Magic numbers for modal dimensions | Use constants |

**Recommended Fix:**
```typescript
// lib/config/layout.ts
export const LAYOUT = {
  header: {
    height: 64,
    mobileHeight: 56,
    scrollThreshold: 100,
  },
  sidebar: {
    width: 280,
    collapsedWidth: 64,
  },
  modal: {
    maxWidth: 600,
    padding: 24,
  },
  carousel: {
    autoplayInterval: 5000,
    transitionDuration: 300,
  },
} as const;

// features/planner/config.ts
export const PLANNER_LAYOUT = {
  canvas: {
    defaultWidth: 10000,
    defaultHeight: 8000,
    minZoom: 0.1,
    maxZoom: 5,
  },
  camera: {
    defaultPosition: { x: 0, y: 5, z: 10 },
    defaultRotation: { x: -0.5, y: 0, z: 0 },
  },
} as const;
```

---

## 2. Error Handling Audit

### 2.1 Global Error Boundaries

**Status:** ❌ Critical Gap

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Critical | `app/(site)/layout.tsx` | N/A | No global error boundary wrapper | Add ErrorBoundary component |
| Critical | `app/` | N/A | No `global-error.tsx` | Create global error boundary |
| High | `app/planner/` | N/A | No error boundary for planner route | Add route-level error boundary |
| High | `app/admin/` | N/A | No error boundary for admin route | Add route-level error boundary |
| High | `app/ops/` | N/A | No error boundary for ops route | Add route-level error boundary |

**Recommended Fix:**
```typescript
// app/global-error.tsx
'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GlobalErrorFallback } from '@/components/error/GlobalErrorFallback';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <ErrorBoundary
          fallback={<GlobalErrorFallback error={error} reset={reset} />}
        >
          <GlobalErrorFallback error={error} reset={reset} />
        </ErrorBoundary>
      </body>
    </html>
  );
}

// components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    // Log to error tracking service
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, { extra: errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
```

### 2.2 Route-Level Error Boundaries

**Status:** ⚠️ Partial Implementation

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `app/(site)/error.tsx` | 22 | Error boundary exists but limited coverage | Extend to all routes |
| High | `app/(site)/products/error.tsx` | 13 | Product error boundary exists | Good pattern; replicate to other routes |
| High | `app/planner/` | N/A | No error.tsx for planner | Add planner error boundary |
| High | `app/admin/` | N/A | No error.tsx for admin | Add admin error boundary |
| Medium | `app/ops/` | N/A | No error.tsx for ops | Add ops error boundary |
| Medium | `app/crm/` | N/A | No error.tsx for crm | Add crm error boundary |

**Recommended Fix:**
```typescript
// app/planner/error.tsx
'use client';

import { ErrorFallback } from '@/components/error/ErrorFallback';

export default function PlannerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Planner Error"
      message="Something went wrong in the planner. Your work is safe."
      showRecoveryOptions={true}
    />
  );
}

// app/admin/error.tsx
'use client';

import { ErrorFallback } from '@/components/error/ErrorFallback';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Admin Error"
      message="Something went wrong in the admin panel."
      showRecoveryOptions={true}
    />
  );
}
```

### 2.3 Component-Level Error Boundaries

**Status:** ❌ Missing Implementation

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `features/planner/editor/PlannerWorkspace.tsx` | N/A | No error boundary for workspace | Wrap in ErrorBoundary |
| High | `components/ThreeViewer.tsx` | 14-29 | No error boundary for 3D viewer | Wrap in ErrorBoundary |
| High | `features/planner/3d/Planner3DViewer.tsx` | 403-415 | No error boundary for 3D viewer | Wrap in ErrorBoundary |
| High | `features/planner/canvas-fabric/FloorplanCanvas.tsx` | N/A | No error boundary for canvas | Wrap in ErrorBoundary |
| Medium | `features/site-assistant/UnifiedAssistant.tsx` | N/A | No error boundary for assistant | Wrap in ErrorBoundary |
| Medium | `components/ui/Modal.tsx` | N/A | No error boundary for modal | Wrap in ErrorBoundary |

**Recommended Fix:**
```typescript
// features/planner/editor/PlannerWorkspace.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PlannerErrorFallback } from '@/components/error/PlannerErrorFallback';

export function PlannerWorkspace() {
  return (
    <ErrorBoundary fallback={<PlannerErrorFallback />}>
      {/* Existing workspace content */}
    </ErrorBoundary>
  );
}

// components/ThreeViewer.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThreeViewerErrorFallback } from '@/components/error/ThreeViewerErrorFallback';

export function ThreeViewer() {
  return (
    <ErrorBoundary fallback={<ThreeViewerErrorFallback />}>
      {/* Existing 3D viewer content */}
    </ErrorBoundary>
  );
}
```

### 2.4 API Error Handling

**Status:** ⚠️ Inconsistent Implementation

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `app/api/ai/advisor/route.ts` | 106 | Generic error handling | Add specific error types |
| High | `app/api/ai-advisor/route.ts` | 424, 443, 496, 624, 659, 670 | Multiple error handling points | Consolidate error handling |
| High | `app/api/ai-assist/route.ts` | 76, 86 | Generic error handling | Add specific error types |
| High | `app/api/planner/ai-advisor/route.ts` | 176, 243 | Generic error handling | Add specific error types |
| Medium | `app/api/products/route.ts` | 80 | Generic error handling | Add specific error types |
| Medium | `app/api/recommendations/route.ts` | 187, 208 | Generic error handling | Add specific error types |
| Medium | `app/api/tracking/route.ts` | 102, 118, 148 | Generic error handling | Add specific error types |
| Medium | `app/api/customer-queries/route.ts` | 122 | Generic error handling | Add specific error types |
| Medium | `app/api/customer-queries/manage/route.ts` | 114, 120, 186, 192 | Generic error handling | Add specific error types |
| Low | `app/api/admin/features/route.ts` | 86, 103, 169, 180 | Generic error handling | Add specific error types |

**Recommended Fix:**
```typescript
// lib/api/errors.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends ApiError {
  constructor(
    message: string = 'Rate limit exceeded',
    public retryAfter?: number
  ) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

// lib/api/handler.ts
import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from './errors';

type RouteHandler = (req: NextRequest, context?: any) => Promise<NextResponse>;

export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json(
          {
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
            },
          },
          { status: error.statusCode }
        );
      }

      console.error('Unhandled API error:', error);

      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
          },
        },
        { status: 500 }
      );
    }
  };
}

// Usage in API routes
export const POST = withErrorHandling(async (req) => {
  // Route implementation
});
```

### 2.5 Async Operation Error Handling

**Status:** ⚠️ Needs Improvement

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `features/planner/persistence/plannerCloudApi.ts` | 44, 63, 113, 149, 181 | No retry logic for failed requests | Add retry with exponential backoff |
| High | `features/planner/lib/aiService.ts` | 154, 212, 255 | No timeout handling for AI requests | Add timeout and retry logic |
| High | `lib/hooks/useRecommendations.ts` | 43 | No error handling for failed fetch | Add error state and retry |
| Medium | `features/site-assistant/UnifiedAssistant.tsx` | 373, 379, 387 | No error handling for async operations | Add error handling |
| Medium | `features/planner/ai/AiAdvisorChatPane.tsx` | 91, 110 | No error handling for AI requests | Add error handling |
| Medium | `lib/ai/useAiAdvisor.ts` | 47, 58 | No error handling for AI requests | Add error handling |
| Low | `components/site/MobileNavDrawer.tsx` | 36, 147 | No error handling for async operations | Add error handling |

**Recommended Fix:**
```typescript
// lib/api/retry.ts
interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: unknown) => boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = () => true,
  } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      // Exponential backoff with jitter
      const jitter = Math.random() * 0.3 * delay;
      await new Promise(resolve => setTimeout(resolve, delay + jitter));

      delay = Math.min(delay * 2, maxDelay);
    }
  }

  throw lastError;
}

// Usage
import { withRetry } from '@/lib/api/retry';

async function fetchRecommendations() {
  return withRetry(
    () => apiClient.get('/recommendations'),
    {
      maxAttempts: 3,
      shouldRetry: (error) => {
        // Only retry on network errors or 5xx errors
        return error instanceof TypeError || 
               (error instanceof ApiError && error.statusCode >= 500);
      },
    }
  );
}
```

---

## 3. Graceful Degradation Audit

### 3.1 JavaScript Disabled

**Status:** ⚠️ Partial Implementation

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `app/(site)/layout.tsx` | N/A | No `<noscript>` fallback | Add noscript message |
| High | `features/planner/` | N/A | Planner requires JavaScript | Add static fallback or message |
| Medium | `components/home/ShowcaseCarousel.tsx` | N/A | Carousel requires JavaScript | Add static fallback |
| Medium | `components/home/FeaturedCarousel.tsx` | N/A | Carousel requires JavaScript | Add static fallback |
| Low | `features/site-assistant/UnifiedAssistant.tsx` | N/A | Assistant requires JavaScript | Add static fallback |

**Recommended Fix:**
```typescript
// app/(site)/layout.tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <noscript>
          <style>{`
            .js-required {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 2rem;
              text-align: center;
              font-family: system-ui, -apple-system, sans-serif;
            }
          `}</style>
        </noscript>
      </head>
      <body>
        <noscript>
          <div className="js-required">
            <div>
              <h1>JavaScript Required</h1>
              <p>This application requires JavaScript to function. Please enable JavaScript in your browser settings.</p>
            </div>
          </div>
        </noscript>
        {children}
      </body>
    </html>
  );
}
```

### 3.2 Network Failures

**Status:** ⚠️ Partial Implementation

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `features/planner/store/offlineStorage.ts` | 7-81 | Offline storage exists but no network failure UI | Add offline indicator |
| High | `features/planner/persistence/persistence.ts` | 22-32 | Local persistence exists but no sync status UI | Add sync status indicator |
| Medium | `lib/hooks/useRecommendations.ts` | N/A | No offline fallback for recommendations | Add cached fallback |
| Medium | `features/site-assistant/UnifiedAssistant.tsx` | N/A | No offline fallback for assistant | Add offline message |
| Low | `components/site/Header.tsx` | N/A | No offline indicator | Add offline indicator |

**Recommended Fix:**
```typescript
// components/NetworkStatus.tsx
'use client';

import { useEffect, useState } from 'react';

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black text-center py-2 text-sm font-medium z-50">
      You are offline. Some features may be unavailable.
    </div>
  );
}

// app/(site)/layout.tsx
import { NetworkStatus } from '@/components/NetworkStatus';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NetworkStatus />
        {children}
      </body>
    </html>
  );
}
```

### 3.3 API Failures

**Status:** ⚠️ Needs Improvement

**Findings:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `lib/hooks/useRecommendations.ts` | 43 | No fallback UI for failed recommendations | Add error state with retry |
| High | `features/site-assistant/UnifiedAssistant.tsx` | 373, 379, 387 | No fallback UI for failed assistant | Add error state with retry |
| High | `features/planner/ai/AiAdvisorChatPane.tsx` | 91, 110 | No fallback UI for failed AI requests | Add error state with retry |
| Medium | `lib/ai/useAiAdvisor.ts` | 47, 58 | No fallback UI for failed AI requests | Add error state with retry |
| Medium | `features/planner/persistence/plannerCloudApi.ts` | 44, 63, 113, 149, 181 | No fallback UI for failed cloud operations | Add error state with retry |
| Low | `components/site/Header.tsx` | 64, 146, 226 | No fallback UI for failed navigation | Add error state |

**Recommended Fix:**
```typescript
// lib/hooks/useRecommendations.ts
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { withRetry } from '@/lib/api/retry';

interface Recommendation {
  id: string;
  name: string;
  // ... other fields
}

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await withRetry(
        () => apiClient.get<Recommendation[]>('/recommendations'),
        { maxAttempts: 3 }
      );
      setRecommendations(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch recommendations'));
      // Try to load from cache
      const cached = localStorage.getItem('recommendations_cache');
      if (cached) {
        setRecommendations(JSON.parse(cached));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return { recommendations, isLoading, error, retry: fetchRecommendations };
}

// Usage in component
export function RecommendationsList() {
  const { recommendations, isLoading, error, retry } = useRecommendations();

  if (isLoading) {
    return <RecommendationsSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-800">Failed to load recommendations</p>
        <button
          onClick={retry}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return <p>No recommendations available</p>;
  }

  return (
    <ul>
      {recommendations.map(rec => (
        <li key={rec.id}>{rec.name}</li>
      ))}
    </ul>
  );
}
```

---

## 4. Prioritized Action Items

### Critical
1. **Centralize environment configuration** — Create `lib/config/env.ts`
2. **Add global error boundary** — `app/global-error.tsx`
3. **Extract magic numbers to constants** — Create `lib/config/constants.ts`
4. **Add API client abstraction** — Create `lib/api/client.ts`
5. **Add route-level error boundaries** — All route segments

### High Priority
6. **Extract hardcoded API endpoints** — Use API client
7. **Extract business logic constants** — Use config files
8. **Add component-level error boundaries** — Planner, 3D viewer, canvas
9. **Implement API error handling pattern** — Create `lib/api/errors.ts`
10. **Add retry logic for async operations** — Create `lib/api/retry.ts`

### Medium Priority
11. **Extract UI strings to content config** — Prepare for i18n
12. **Add network status indicator** — Create `components/NetworkStatus.tsx`
13. **Add API failure fallback UI** — All async operations
14. **Add noscript fallback** — Root layout
15. **Consolidate error handling in API routes** — Use `withErrorHandling` wrapper

### Low Priority
16. **Add offline indicators** — All relevant components
17. **Add cached fallbacks** — Recommendations, assistant
18. **Document error handling patterns** — Create documentation
19. **Add error tracking integration** — Sentry or similar
20. **Add error monitoring dashboard** — Track error rates

---

## 5. Testing Recommendations

### Error Boundary Tests
```typescript
// tests/components/ErrorBoundary.test.tsx
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function ThrowError() {
  throw new Error('Test error');
}

describe('ErrorBoundary', () => {
  it('should catch errors and render fallback', () => {
    const fallback = <div>Error occurred</div>;
    
    render(
      <ErrorBoundary fallback={fallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error occurred')).toBeInTheDocument();
  });

  it('should render children when no error', () => {
    render(
      <ErrorBoundary fallback={<div>Error</div>}>
        <div>Content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
```

### API Error Handling Tests
```typescript
// tests/lib/api/errors.test.ts
import { ApiError, ValidationError, NotFoundError } from '@/lib/api/errors';

describe('API Errors', () => {
  it('should create ApiError with correct properties', () => {
    const error = new ApiError('Test error', 500, 'TEST_ERROR');
    
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('TEST_ERROR');
  });

  it('should create ValidationError with 400 status', () => {
    const error = new ValidationError('Invalid input');
    
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('should create NotFoundError with 404 status', () => {
    const error = new NotFoundError();
    
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
  });
});
```

### Retry Logic Tests
```typescript
// tests/lib/api/retry.test.ts
import { withRetry } from '@/lib/api/retry';

describe('withRetry', () => {
  it('should return result on success', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    
    const result = await withRetry(fn);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValue('success');
    
    const result = await withRetry(fn, { maxAttempts: 3 });
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw after max attempts', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Always fails'));
    
    await expect(withRetry(fn, { maxAttempts: 3 })).rejects.toThrow('Always fails');
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
```

---

**Report Generated:** 2026-06-20T02:51Z  
**Next Audit Recommended:** After critical fixes (2 weeks)
