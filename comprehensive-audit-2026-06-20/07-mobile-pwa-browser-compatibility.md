# Report 07: Mobile, PWA & Browser Compatibility

**Audit Date:** 2026-06-20  
**Auditor:** Agent D  
**Scope:** Mobile responsiveness, PWA capabilities, offline support, browser compatibility

---

## Executive Summary

The Oando Platform demonstrates strong mobile responsiveness through Tailwind CSS and responsive design patterns, but lacks PWA infrastructure (no manifest.json, no service worker). Offline support is partially implemented via IndexedDB for planner data, but there's no installable PWA shell. Browser compatibility is good with modern CSS features, but internationalization is hardcoded to English (en-IN).

**Overall Scores:**
- Mobile Responsiveness: 85/100 (Good)
- PWA Implementation: 20/100 (Critical Gaps)
- Offline Support: 60/100 (Partial Implementation)
- Browser Compatibility: 80/100 (Good)
- Internationalization: 15/100 (Not Implemented)

---

## 1. Mobile Responsiveness

### 1.1 Responsive Design Implementation

**Status:** ✅ Strong Implementation

**Findings:**

**Positive:**
- Tailwind CSS responsive utilities used throughout (sm:, md:, lg:, xl:)
- Mobile-first design approach in most components
- Responsive typography scales (typ-h1, typ-h2, etc.)
- Flexible grid layouts with CSS Grid and Flexbox
- Touch-friendly button sizes (min 44x44px)

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Medium | `features/planner/editor/PlannerWorkspace.tsx` | Various | Canvas controls may be too small on mobile | Increase touch target sizes for mobile |
| Medium | `features/planner/canvas-fabric/FabricCanvasSubToolbar.tsx` | Various | Toolbar buttons need larger mobile touch targets | Add mobile-specific sizing |
| Low | `components/site/Navigation.tsx` | Various | Mobile menu could have better swipe gestures | Add touch gesture support |
| Low | `app/(site)/products/[category]/CategoryPageView.tsx` | Various | Product grid could be more compact on mobile | Optimize grid for small screens |

**Code Example — Mobile Touch Targets:**
```typescript
// CURRENT:
<button className="h-8 w-8">

// RECOMMENDED:
<button className="h-8 w-8 md:h-10 md:w-10 touch-manipulation">
```

### 1.2 Viewport Configuration

**Status:** ✅ Implemented

**File:** `lib/siteViewport.ts`

**Positive:**
- Proper viewport meta tag configuration
- Theme color support for mobile browsers
- Prevents zoom on input focus (iOS)

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Low | `lib/siteViewport.ts` | Various | No maximum-scale prevention for accessibility | Consider allowing user zoom |

### 1.3 Touch Interactions

**Status:** ⚠️ Partial Implementation

**Findings:**

**Positive:**
- Canvas supports touch events via Fabric.js
- Drag-and-drop works on touch devices
- Swipe gestures in some carousels

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| High | `features/planner/canvas-fabric/FloorplanCanvas.tsx` | Various | No pinch-to-zoom on mobile | Add touch gesture handlers |
| Medium | `features/planner/editor/PlannerWorkspace.tsx` | Various | Right-click context menu not available on mobile | Add long-press gesture |
| Medium | `components/ui/Dropdown.tsx` | Various | Hover states don't work on touch | Add touch-friendly alternatives |

---

## 2. PWA Implementation

### 2.1 Web App Manifest

**Status:** ❌ Not Implemented

**Findings:**

**Missing:**
- No `manifest.json` or `manifest.webmanifest` file
- No app icons defined
- No app name, short name, or theme color in manifest
- No display mode configuration
- No start URL defined

**Required Files:**
```
public/
  manifest.json          ❌ Missing
  icons/
    icon-72x72.png       ❌ Missing
    icon-96x96.png       ❌ Missing
    icon-128x128.png     ❌ Missing
    icon-144x144.png     ❌ Missing
    icon-152x152.png     ❌ Missing
    icon-192x192.png     ❌ Missing
    icon-384x384.png     ❌ Missing
    icon-512x512.png     ❌ Missing
    apple-touch-icon.png ❌ Missing
```

**Recommended Implementation:**
```json
// public/manifest.json
{
  "name": "Oando Platform - Modular Furniture Planner",
  "short_name": "Oando",
  "description": "Design your perfect workspace with our 3D planner",
  "start_url": "/planner",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1a1a1a",
  "orientation": "any",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["business", "productivity", "design"],
  "screenshots": [
    {
      "src": "/screenshots/desktop.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/screenshots/mobile.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
```

**Link in Layout:**
```tsx
// app/(site)/layout.tsx
<head>
  <link rel="manifest" href="/manifest.json" />
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
  <meta name="theme-color" content="#1a1a1a" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
</head>
```

### 2.2 Service Worker

**Status:** ❌ Not Implemented

**Findings:**

**Missing:**
- No service worker registration
- No offline caching strategy
- No background sync
- No push notification support

**Recommended Implementation:**
```javascript
// public/sw.js
const CACHE_NAME = 'oando-v1';
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = [
  '/',
  '/planner',
  '/offline.html',
  '/manifest.json'
];

// Install event - precache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(OFFLINE_URL))
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then((response) => response || fetch(event.request))
    );
  }
});
```

**Registration:**
```typescript
// app/(site)/layout.tsx or lib/registerServiceWorker.ts
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}
```

### 2.3 Installability

**Status:** ❌ Not Installable

**Missing Requirements:**
1. ❌ Web app manifest
2. ❌ Service worker
3. ❌ HTTPS (present in production)
4. ❌ Icons (192x192 and 512x512)

**Current Status:** The app cannot be installed as a PWA on any platform.

---

## 3. Offline Support

### 3.1 IndexedDB Implementation

**Status:** ✅ Implemented (Partial)

**File:** `features/planner/store/offlineStorage.ts`

**Positive:**
- IndexedDB wrapper for offline plan storage
- Sync queue for offline changes
- Retry logic with exponential backoff
- Conflict resolution support
- Proper error handling with OfflineStorageError

**Implementation Details:**
```typescript
// Database: planner-offline-db
// Stores:
// - plans: OfflinePlan (id, document, syncStatus, etc.)
// - sync_queue: SyncQueueItem (operation, retryCount, etc.)

// Features:
- Save/load plans offline
- Queue create/update/delete operations
- Automatic sync when online
- Max 3 retry attempts
- 5-second retry delay
```

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Medium | `features/planner/store/offlineStorage.ts` | Various | No storage quota management | Add quota checks and cleanup |
| Medium | `features/planner/store/syncQueueProcessor.ts` | Various | No user notification of sync status | Add sync status UI |
| Low | `features/planner/store/offlineStorage.ts` | Various | No data export/import for backup | Add export functionality |

### 3.2 Online/Offline Detection

**Status:** ⚠️ Partial Implementation

**Findings:**

**Positive:**
- Sync queue processor checks connectivity
- Retry logic respects network state

**Missing:**
- No global online/offline status indicator
- No offline mode banner
- No connection quality detection
- No automatic sync trigger on reconnect

**Recommended Implementation:**
```typescript
// hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('connection' in navigator) {
      setConnectionType((navigator as any).connection.effectiveType);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, connectionType };
}

// Usage in PlannerWorkspace
const { isOnline } = useNetworkStatus();

{!isOnline && (
  <div className="bg-warning text-white p-2 text-center text-sm">
    You are offline. Changes will sync when connection is restored.
  </div>
)}
```

### 3.3 Offline Page

**Status:** ❌ Not Implemented

**Missing:**
- No `/offline.html` fallback page
- No offline error handling for navigation
- No cached resources for offline viewing

**Recommended Implementation:**
```tsx
// app/offline/page.tsx
export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <WifiOff className="h-16 w-16 mx-auto text-muted" />
        <h1 className="typ-h2">You're Offline</h1>
        <p className="typ-body text-muted">
          Please check your internet connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
```

---

## 4. Browser Compatibility

### 4.1 CSS Feature Support

**Status:** ✅ Good Support

**Findings:**

**Positive:**
- Tailwind CSS handles vendor prefixes automatically
- CSS Grid and Flexbox widely supported
- Custom properties (CSS variables) used appropriately
- Modern color functions (oklch) with fallbacks

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Low | Various | Various | `backdrop-filter` not supported in older browsers | Add fallback styles |
| Low | `app/css/core/site/bundles/*.css` | Various | Some CSS nesting may not work in Safari < 16.5 | Add PostCSS nesting plugin |

### 4.2 JavaScript Feature Support

**Status:** ✅ Good Support

**Findings:**

**Positive:**
- Next.js transpiles to ES5/ES6 for compatibility
- TypeScript ensures type safety
- Modern APIs used appropriately (IntersectionObserver, etc.)

**Issues:**

| Severity | File | Line | Issue | Remediation |
|----------|------|------|-------|-------------|
| Low | Various | Various | Optional chaining may not work in IE11 | Already handled by Next.js |
| Low | `features/planner/3d/Planner3DViewer.tsx` | Various | WebGL2 not supported in older browsers | Add WebGL1 fallback |

### 4.3 Polyfills

**Status:** ✅ Adequate

**Findings:**

**Positive:**
- Next.js includes necessary polyfills
- Core-js not needed (handled by framework)
- Modern browser targets defined in browserslist

**Recommendation:**
Add explicit browser support documentation:
```markdown
## Browser Support

### Desktop
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile
- iOS Safari 14+
- Chrome for Android 90+
- Samsung Internet 14+

### Not Supported
- Internet Explorer (any version)
- Opera Mini
```

---

## 5. Internationalization (i18n)

### 5.1 Current State

**Status:** ❌ Not Implemented

**Findings:**

**Current Implementation:**
- Hardcoded `lang="en-IN"` in root layout
- No i18n framework installed
- All text is hardcoded in English
- No locale routing
- No translation files

**Code Evidence:**
```tsx
// app/(site)/layout.tsx:28
<html lang="en-IN">

// features/planner/canvas-fabric/lib/formatDate.ts:1
export function formatDate(date: Date, pattern: string, _locale: string): string {
  // _locale parameter is ignored - always uses English format
}
```

### 5.2 Missing i18n Infrastructure

**Required for Internationalization:**

1. **i18n Framework:**
   - next-intl (recommended for Next.js 14+)
   - react-i18next (alternative)
   - Lingui (alternative)

2. **Locale Routing:**
   ```
   /en/planner
   /hi/planner
   /fr/planner
   ```

3. **Translation Files:**
   ```
   messages/
     en.json
     hi.json
     fr.json
   ```

4. **Locale Detection:**
   - Accept-Language header parsing
   - Cookie-based locale preference
   - User profile locale setting

### 5.3 Hardcoded Strings

**Status:** ❌ All Strings Hardcoded

**Examples:**

| File | Line | Hardcoded String |
|------|------|------------------|
| `app/(site)/login/LoginForm.tsx` | 110 | "Sign in to your workspace" |
| `app/(site)/access/AccessForm.tsx` | 59 | "Welcome to Oando" |
| `features/planner/editor/PlannerLeftPanel.tsx` | Various | "Products", "Layers", "Properties" |
| `features/planner/canvas-fabric/RoomPresetsModal.tsx` | Various | "Select Room Preset", "Apply" |
| `components/site/Navigation.tsx` | Various | "Home", "Products", "Planner" |

**Recommended Implementation:**
```typescript
// messages/en.json
{
  "common": {
    "signIn": "Sign in",
    "signOut": "Sign out",
    "save": "Save",
    "cancel": "Cancel"
  },
  "planner": {
    "workspace": "Workspace",
    "products": "Products",
    "layers": "Layers",
    "properties": "Properties"
  },
  "auth": {
    "welcome": "Welcome to Oando",
    "signInSubtitle": "Sign in to your workspace"
  }
}

// messages/hi.json
{
  "common": {
    "signIn": "साइन इन करें",
    "signOut": "साइन आउट करें",
    "save": "सहेजें",
    "cancel": "रद्द करें"
  },
  "planner": {
    "workspace": "वर्कस्पेस",
    "products": "उत्पाद",
    "layers": "परतें",
    "properties": "गुण"
  }
}

// Usage in components
import { useTranslations } from 'next-intl';

export function LoginForm() {
  const t = useTranslations('auth');
  
  return (
    <h2>{t('welcome')}</h2>
    <p>{t('signInSubtitle')}</p>
  );
}
```

### 5.4 Date/Time/Number Formatting

**Status:** ⚠️ Partial Implementation

**Findings:**

**Current:**
- `formatDate` function accepts locale parameter but ignores it
- No Intl.NumberFormat usage
- No locale-aware currency formatting

**Recommended:**
```typescript
// lib/formatting.ts
export function formatDate(date: Date, locale: string = 'en-IN'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatCurrency(amount: number, locale: string = 'en-IN', currency: string = 'INR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(num: number, locale: string = 'en-IN'): string {
  return new Intl.NumberFormat(locale).format(num);
}
```

---

## 6. Performance on Mobile

### 6.1 Bundle Size

**Status:** ⚠️ Needs Optimization

**Findings:**

**Issues:**

| Severity | Issue | Impact | Remediation |
|----------|-------|--------|-------------|
| High | Three.js bundle (500KB+) | Slow initial load on mobile | Code-split 3D viewer |
| High | Fabric.js bundle (300KB+) | Slow canvas initialization | Lazy load canvas |
| Medium | Large product images | Slow page loads | Optimize with next/image |
| Medium | Multiple font files | Slow text rendering | Subset fonts |

**Recommendations:**
```typescript
// Dynamic import for 3D viewer
const Planner3DViewer = dynamic(
  () => import('@/features/planner/3d/Planner3DViewer'),
  { 
    ssr: false,
    loading: () => <Planner3DSkeleton />
  }
);

// Dynamic import for canvas
const FloorplanCanvas = dynamic(
  () => import('@/features/planner/canvas-fabric/FloorplanCanvas'),
  { 
    ssr: false,
    loading: () => <CanvasSkeleton />
  }
);
```

### 6.2 Touch Performance

**Status:** ⚠️ Needs Improvement

**Findings:**

**Issues:**

| Severity | Issue | Impact | Remediation |
|----------|-------|--------|-------------|
| Medium | Canvas redraw on every touch move | Janky interactions on mobile | Throttle touch events |
| Medium | 3D rendering on mobile | Battery drain, overheating | Reduce DPR on mobile |
| Low | No gesture recognition | Poor UX | Add touch gesture library |

**Recommendations:**
```typescript
// Reduce DPR on mobile
<Canvas
  dpr={typeof window !== 'undefined' && window.innerWidth < 768 ? [1, 1.5] : [1, 2]}
>

// Throttle touch events
const handleTouchMove = throttle((event) => {
  // Handle touch move
}, 16); // 60fps
```

---

## 7. Recommendations

### 7.1 Critical (Must Fix)

1. **Add PWA manifest and icons**
   - Create manifest.json
   - Generate app icons (192x192, 512x512)
   - Add manifest link to layout

2. **Implement service worker**
   - Cache essential resources
   - Provide offline fallback
   - Enable installability

3. **Add offline status indicator**
   - Show online/offline banner
   - Display sync status
   - Notify users of pending sync

### 7.2 High Priority

4. **Implement internationalization**
   - Choose i18n framework (next-intl recommended)
   - Extract all hardcoded strings
   - Create translation files
   - Add locale routing

5. **Optimize mobile performance**
   - Code-split 3D viewer
   - Lazy load canvas
   - Reduce DPR on mobile
   - Optimize images

6. **Add touch gesture support**
   - Pinch-to-zoom for canvas
   - Long-press for context menu
   - Swipe gestures for navigation

### 7.3 Medium Priority

7. **Improve mobile UX**
   - Larger touch targets
   - Better mobile navigation
   - Optimized forms for mobile
   - Mobile-specific layouts

8. **Enhance offline capabilities**
   - Offline page
   - Data export/import
   - Storage quota management
   - Background sync

9. **Browser compatibility documentation**
   - Document supported browsers
   - Add polyfills if needed
   - Test on target browsers

---

## 8. Testing Recommendations

### 8.1 Mobile Testing Checklist

- [ ] Test on iOS Safari (14+)
- [ ] Test on Android Chrome (90+)
- [ ] Test on various screen sizes (320px - 1440px)
- [ ] Test touch interactions (tap, swipe, pinch)
- [ ] Test offline mode
- [ ] Test PWA installation
- [ ] Test landscape orientation
- [ ] Test with slow 3G connection
- [ ] Test with low battery mode
- [ ] Test with reduced motion preferences

### 8.2 PWA Testing Checklist

- [ ] Lighthouse PWA audit passes
- [ ] Install prompt appears
- [ ] App installs successfully
- [ ] Offline mode works
- [ ] Service worker registers
- [ ] Manifest is valid
- [ ] Icons display correctly
- [ ] Theme color applies
- [ ] Splash screen shows
- [ ] Background sync works

---

## 9. Conclusion

The Oando Platform has a solid foundation for mobile responsiveness but critically lacks PWA infrastructure. The offline storage implementation is sophisticated but incomplete without a service worker to enable true offline functionality. Internationalization is not implemented, limiting the app to English-only users.

**Priority Actions:**
1. Implement PWA manifest and service worker (enables installability)
2. Add offline status indicator and offline page
3. Implement internationalization framework
4. Optimize bundle size for mobile
5. Add touch gesture support

**Estimated Effort:**
- PWA implementation: 2-3 days
- Offline enhancements: 1-2 days
- Internationalization: 5-7 days
- Mobile optimizations: 2-3 days
- Touch gestures: 1-2 days

**Total Estimated Effort:** 11-17 days

---

*Report generated as part of comprehensive codebase audit on 2026-06-20*
