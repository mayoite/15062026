import { MermaidDiagram } from '../components/MermaidDiagram'
import { CodeBlock } from '../components/CodeBlock'
import { CollapsibleSection } from '../components/CollapsibleSection'

const highLevelDiagram = `flowchart TB
    subgraph Client["Client (Browser)"]
        UI["Next.js App Router<br/>React 19 Components"]
        Canvas["Fabric.js Canvas<br/>2D Floorplan"]
        ThreeD["R3F / Three.js<br/>3D Preview"]
        State["Zustand Stores<br/>+ TanStack Query"]
    end

    subgraph Edge["Vercel Edge"]
        MW["Middleware<br/>proxy.ts / auth"]
        SSR["Server Components<br/>SSR/SSG"]
    end

    subgraph Supabase["Supabase"]
        Auth["Auth Service<br/>Email + Magic Link"]
        DB[("PostgreSQL<br/>RLS Enabled")]
        Storage["Storage Buckets<br/>Assets"]
    end

    subgraph CDN["Cloudflare R2"]
        Assets["Catalog Images<br/>3D GLTF Models"]
    end

    UI --> State
    Canvas --> State
    State --> ThreeD
    UI --> MW
    MW --> SSR
    SSR --> Auth
    SSR --> DB
    SSR --> Storage
    UI --> Assets
    Canvas --> Assets
    ThreeD --> Assets

    style Client fill:#0f172a,stroke:#0ea5e9
    style Edge fill:#1e1b2e,stroke:#a855f7
    style Supabase fill:#052e16,stroke:#22c55e
    style CDN fill:#2a0e0e,stroke:#f97316`

const plannerDataFlow = `flowchart LR
    User["User Action<br/>draw / place / select"]
    Fabric["Fabric.js Canvas<br/>Object Model"]
    Store["Zustand Store<br/>plannerStore"]
    Sync["2D to 3D<br/>Sync Layer"]
    ThreeD["R3F Scene<br/>Planner3DViewer"]
    Persist["Supabase<br/>plans table"]

    User -->|event| Fabric
    Fabric -->|update| Store
    Store -->|sync| Sync
    Sync -->|render| ThreeD
    Store -->|debounce| Persist
    Persist -->|load| Store

    style Fabric fill:#451a03,stroke:#f59e0b
    style Store fill:#1a1a2e,stroke:#f97316
    style ThreeD fill:#0c4a6e,stroke:#0ea5e9`

const authFlow = `sequenceDiagram
    participant U as User
    participant B as Browser
    participant M as Middleware
    participant S as Supabase Auth
    participant DB as Database

    U->>B: Visit /planner
    B->>M: Request
    M->>S: Check session cookie
    S-->>M: No session
    M-->>B: Redirect /login
    U->>B: Enter email
    B->>S: signInWithOtp(email)
    S-->>U: Send magic link
    U->>B: Click link
    B->>S: Verify OTP
    S-->>B: Set session cookie
    B->>M: Request with cookie
    M->>S: Validate session
    S-->>M: Valid + user_id
    M->>DB: Query with RLS (user_id)
    DB-->>B: User-scoped data
    B-->>U: Render planner`

const featureModules = `flowchart TB
    subgraph App["app/ (Next.js App Router)"]
        Pages["Pages & Layouts"]
        API["API Routes<br/>app/api/*"]
    end

    subgraph Features["features/"]
        Planner["planner/<br/>canvas-fabric<br/>3d, editor, store"]
        Catalog["catalog/<br/>products, search"]
        CRM["crm/<br/>customers, leads"]
        Admin["admin/<br/>dashboards"]
        AI["ai/<br/>assistants"]
    end

    subgraph Lib["lib/"]
        Supabase["supabase/<br/>client + server"]
        Auth["auth/<br/>middleware"]
        Utils["utils, hooks<br/>types, ui"]
    end

    subgraph Config["config/"]
        Build["build/<br/>ts, eslint, playwright"]
        Database["database/<br/>types, schema"]
        Env["environment/<br/>env validation"]
    end

    Pages --> Planner
    Pages --> Catalog
    Pages --> CRM
    Pages --> Admin
    API --> Lib
    Planner --> Lib
    Catalog --> Lib
    CRM --> Lib
    Admin --> Lib
    Lib --> Config

    style Features fill:#0f172a,stroke:#0ea5e9
    style Lib fill:#052e16,stroke:#22c55e`

export function Architecture() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="section-heading">Architecture</h1>
        <p className="section-subheading">
          How the Oando Platform is structured, from high-level system design to data flow and authentication.
        </p>
      </header>

      {/* High-level system */}
      <section id="app-structure" className="mb-12 scroll-mt-4">
        <h2 className="text-xl font-bold text-white mb-2">High-Level System</h2>
        <p className="text-sm text-gray-400 mb-4">
          The platform is a flat-root Next.js 16 application. The client bundle contains the React UI, Fabric.js 2D canvas, 
          and React Three Fiber 3D viewer — all coordinated by Zustand stores. Server-side rendering and middleware run on 
          Vercel's edge, proxying auth and data requests to Supabase (PostgreSQL + Auth + Storage). Static catalog assets 
          are served from Cloudflare R2.
        </p>
        <MermaidDiagram chart={highLevelDiagram} title="System Architecture Overview" />
      </section>

      {/* App structure */}
      <section className="mb-12">
        <CollapsibleSection title="App Structure (Next.js App Router)" badge="Routing">
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              The app uses Next.js 16's App Router with a flat-root structure. Route groups organize marketing vs. 
              workspace without affecting URLs.
            </p>
            <CodeBlock
              title="app/ directory structure"
              language="bash"
              code={`app/
├── (marketing)/          # Route group: marketing site
│   ├── page.tsx          # Landing page
│   ├── about/
│   └── contact/
├── (workspace)/          # Route group: authenticated
│   └── layout.tsx        # Auth-gated layout
├── planner/              # The room planner (/planner)
│   ├── layout.tsx
│   ├── page.tsx
│   └── plannerProducts.ts
├── crm/                  # CRM module (/crm)
├── admin/                # Admin dashboard (/admin)
├── api/                  # API routes
│   ├── auth/
│   ├── catalog/
│   └── crm/
├── css/                  # Global CSS (tokens, bundles)
│   ├── core/tokens/theme.css
│   └── core/planner/bundles/
└── layout.tsx            # Root layout`}
            />
            <p className="text-sm text-gray-500">
              Route groups <code className="text-brand-400">(marketing)</code> and <code className="text-brand-400">(workspace)</code> 
              allow different layouts and middleware behavior without URL prefixes.
            </p>
          </div>
        </CollapsibleSection>
      </section>

      {/* Feature modules */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-2">Feature Module Organization</h2>
        <p className="text-sm text-gray-400 mb-4">
          Feature code lives in <code className="text-brand-400 bg-gray-900 px-1 rounded">features/</code> and is imported by 
          app routes. This keeps route files thin and collocates feature logic, components, and tests.
        </p>
        <MermaidDiagram chart={featureModules} title="Feature Module Dependencies" />
      </section>

      {/* Planner data flow */}
      <section id="data-flow" className="mb-12 scroll-mt-4">
        <h2 className="text-xl font-bold text-white mb-2">Planner Data Flow</h2>
        <p className="text-sm text-gray-400 mb-4">
          The planner is the most complex feature. User actions on the Fabric canvas flow through a Zustand store, 
          which syncs to the R3F 3D viewer and persists to Supabase with debouncing.
        </p>
        <MermaidDiagram chart={plannerDataFlow} title="2D ↔ 3D Sync and Persistence" />

        <div className="mt-6">
          <CodeBlock
            title="Simplified store + sync pattern (features/planner/store)"
            language="typescript"
            code={`import { create } from 'zustand'
import { temporal } from 'zundo'  // snapshot middleware

interface PlannerState {
  objects: PlannerObject[]
  selectedId: string | null
  tool: 'select' | 'wall' | 'draw' | 'place'
  setObjects: (objs: PlannerObject[]) => void
  select: (id: string | null) => void
  setTool: (tool: PlannerState['tool']) => void
}

export const usePlannerStore = create<PlannerState>()(
  temporal(
    (set) => ({
      objects: [],
      selectedId: null,
      tool: 'select',
      setObjects: (objects) => set({ objects }),
      select: (selectedId) => set({ selectedId }),
      setTool: (tool) => set({ tool }),
    }),
    { limit: 50 }  // history depth for undo/redo
  )
)

// 2D -> 3D sync: subscribe to objects, project to 3D scene
usePlannerStore.subscribe(
  (s) => s.objects,
  (objects) => renderThreeDScene(objects),
  { fireImmediately: false }
)

// Persistence: debounced save to Supabase
const debouncedSave = debounce(async (objects, userId) => {
  await supabase.from('plans').upsert({
    user_id: userId,
    data: { objects },
    updated_at: new Date().toISOString(),
  })
}, 800)`}
          />
        </div>
      </section>

      {/* Auth flow */}
      <section id="auth-flow" className="mb-12 scroll-mt-4">
        <h2 className="text-xl font-bold text-white mb-2">Authentication Flow</h2>
        <p className="text-sm text-gray-400 mb-4">
          Supabase Auth with magic-link (OTP) email authentication. Session cookies are validated in Next.js middleware 
          for protected routes. Row Level Security enforces user-scoped data access at the database level.
        </p>
        <MermaidDiagram chart={authFlow} title="Magic Link Authentication Sequence" />

        <div className="mt-6">
          <CodeBlock
            title="Middleware auth guard (proxy.ts pattern)"
            language="typescript"
            code={`import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect /planner, /crm, /admin
  const protectedPaths = ['/planner', '/crm', '/admin']
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p))

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ['/planner/:path*', '/crm/:path*', '/admin/:path*'],
}`}
          />
        </div>
      </section>

      {/* CSS architecture */}
      <section className="mb-12">
        <CollapsibleSection title="CSS Architecture" badge="Styling">
          <div className="space-y-3 text-sm text-gray-400">
            <p>
              CSS is organized into a token-driven system with no hex colors in components. All colors come from 
              <code className="text-brand-400 bg-gray-900 px-1 rounded">app/css/core/tokens/theme.css</code>.
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-gray-500">
              <li><strong className="text-gray-300">Base:</strong> <code className="text-brand-400">app/css/base/</code> — global primitives (animations, resets)</li>
              <li><strong className="text-gray-300">Tokens:</strong> <code className="text-brand-400">app/css/core/tokens/theme.css</code> — single source of truth</li>
              <li><strong className="text-gray-300">Entry:</strong> <code className="text-brand-400">globals.css</code> → <code className="text-brand-400">app/css/index.css</code></li>
              <li><strong className="text-gray-300">Site bundles:</strong> <code className="text-brand-400">app/css/core/site/bundles/*</code> per layout</li>
              <li><strong className="text-gray-300">Planner bundles:</strong> <code className="text-brand-400">app/css/core/planner/bundles/*</code></li>
            </ul>
          </div>
        </CollapsibleSection>
      </section>
    </div>
  )
}
