import { MermaidDiagram } from '../components/MermaidDiagram'
import { CodeBlock } from '../components/CodeBlock'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { PenTool, ShoppingBag, Users, Settings, Bot, Box } from 'lucide-react'

const features = [
  {
    id: 'planner',
    name: 'Room Planner',
    icon: PenTool,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    path: 'features/planner/',
    summary: '2D/3D floorplan designer with Fabric.js canvas and React Three Fiber 3D preview.',
    keyFiles: [
      'features/planner/canvas-fabric/FloorplanCanvas.tsx',
      'features/planner/canvas-fabric/FabricCanvasWorkspace.tsx',
      'features/planner/3d/Planner3DViewer.tsx',
      'features/planner/canvas-fabric/fabricToViewerShapes.ts',
      'features/planner/store/',
    ],
  },
  {
    id: 'catalog',
    name: 'Product Catalog',
    icon: ShoppingBag,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    path: 'features/catalog/',
    summary: 'Furniture product catalog with Supabase-backed data and R2 CDN assets.',
    keyFiles: [
      'features/catalog/',
      'lib/catalog/',
      'lib/getProducts.ts',
      'lib/productSlugResolver.ts',
      'scripts/ingest-planner-catalog.ts',
    ],
  },
  {
    id: 'crm',
    name: 'CRM',
    icon: Users,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    path: 'features/crm/',
    summary: 'Customer relationship management with leads pipeline and analytics dashboards.',
    keyFiles: [
      'features/crm/',
      'app/crm/',
    ],
  },
  {
    id: 'admin',
    name: 'Admin',
    icon: Settings,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    path: 'features/admin/',
    summary: 'Admin dashboard for catalog management, users, and analytics.',
    keyFiles: [
      'features/admin/',
      'app/admin/',
    ],
  },
  {
    id: 'ai',
    name: 'AI Assistant',
    icon: Bot,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    path: 'features/ai/',
    summary: 'AI-powered assistants for catalog QA, product descriptions, and chat support.',
    keyFiles: [
      'features/ai/',
      'features/site-assistant/',
    ],
  },
  {
    id: 'configurator',
    name: 'Configurator',
    icon: Box,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    path: 'lib/configurator/',
    summary: 'Product configurator logic for customizable furniture options.',
    keyFiles: [
      'lib/configurator/',
    ],
  },
]

const plannerArchitecture = `flowchart TB
    subgraph Canvas["2D Canvas (Fabric.js)"]
        Floor["FloorplanCanvas"]
        Tools["FabricDrawToolsBar"]
        CtxMenu["FabricCanvasContextMenu"]
        Lib["FabricLibraryPanel"]
        Sub["FabricCanvasSubToolbar"]
    end

    subgraph Bridge["2D ↔ 3D Bridge"]
        Conv["fabricToViewerShapes"]
        Scene["fabricSceneUtils"]
        Runtime["plannerRuntime"]
    end

    subgraph ThreeD["3D Viewer (R3F)"]
        Viewer["Planner3DViewer"]
        Mats["viewerMaterials"]
        Models["models/"]
    end

    subgraph State["State"]
        Store["Zustand store"]
        Hooks["hooks/"]
        Persist["persistence/"]
    end

    Floor --> Store
    Tools --> Store
    Lib --> Store
    Store --> Conv
    Conv --> Viewer
    Viewer --> Mats
    Viewer --> Models
    Store --> Persist
    Hooks --> Store

    style Canvas fill:#451a03,stroke:#f59e0b
    style Bridge fill:#1e1b2e,stroke:#a855f7
    style ThreeD fill:#0c4a6e,stroke:#0ea5e9`

export function Features() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="section-heading">Features</h1>
        <p className="section-subheading">
          Deep-dive into each feature module of the Oando Platform.
        </p>
      </header>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
        {features.map(f => {
          const Icon = f.icon
          return (
            <a
              key={f.id}
              href={`#${f.id}`}
              className="card group hover:border-gray-700 transition-colors"
            >
              <div className={`p-2.5 rounded-xl ${f.bg} inline-flex mb-3`}>
                <Icon size={20} className={f.color} />
              </div>
              <h3 className="font-semibold text-white text-sm mb-1">{f.name}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-2">{f.summary}</p>
              <code className="text-xs text-gray-600 font-mono">{f.path}</code>
            </a>
          )
        })}
      </div>

      {/* Planner deep dive */}
      <section id="planner" className="mb-12 scroll-mt-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-amber-500/10">
            <PenTool size={20} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Room Planner</h2>
            <p className="text-xs text-gray-500">The flagship feature — 2D/3D floorplan designer</p>
          </div>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          The planner combines a Fabric.js 2D canvas for drawing rooms and placing furniture with a React Three Fiber 
          3D viewer that renders the same scene in real-time. The Fabric.js canvas replaced the previous tldraw 
          implementation in the 2026-06-18 session for better control over furniture object model and snapping.
        </p>

        <MermaidDiagram chart={plannerArchitecture} title="Planner Component Architecture" />

        <div className="mt-6 space-y-4">
          <CollapsibleSection title="Key Canvas Components" badge="Fabric.js">
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-1">FloorplanCanvas.tsx</h4>
                <p className="text-xs text-gray-500">Main Fabric.js canvas instance. Initializes the canvas, handles object events, and bridges to the Zustand store.</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-1">FabricCanvasWorkspace.tsx</h4>
                <p className="text-xs text-gray-500">Top-level workspace container that lays out the canvas, toolbar, library panel, and 3D viewer in resizable panels.</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-1">FabricDrawToolsBar.tsx</h4>
                <p className="text-xs text-gray-500">Tool selection bar — select, wall, draw room, place furniture. Sets the active tool in the store.</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-1">FabricLibraryPanel.tsx</h4>
                <p className="text-xs text-gray-500">Searchable product library panel. Uses Fuse.js for fuzzy search across catalog items. Drag to canvas to place.</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-1">FabricCanvasContextMenu.tsx</h4>
                <p className="text-xs text-gray-500">Right-click context menu for selected objects — rotate, duplicate, delete, bring to front.</p>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="2D → 3D Conversion" badge="Bridge" defaultOpen={false}>
            <p className="text-sm text-gray-400 mb-3">
              The bridge layer converts Fabric.js objects into Three.js scene elements. Each furniture item has a 
              GLTF model loaded from R2 CDN, positioned and rotated based on its 2D representation.
            </p>
            <CodeBlock
              title="fabricToViewerShapes.ts (simplified)"
              language="typescript"
              code={`import type { FabricObject } from 'fabric'
import type { ViewerShape } from './types'

// Map Fabric.js objects -> R3F scene shapes
export function fabricToViewerShapes(
  objects: FabricObject[]
): ViewerShape[] {
  return objects
    .filter(obj => obj.type !== 'group-marker')
    .map(obj => {
      const meta = obj.get('plannerMeta') as PlannerMeta
      return {
        id: meta.id,
        type: meta.type,        // 'room' | 'furniture' | 'wall'
        productId: meta.productId,
        position: [obj.left ?? 0, 0, obj.top ?? 0],
        rotation: [0, (obj.angle ?? 0) * (Math.PI / 180), 0],
        scale: [obj.scaleX ?? 1, 1, obj.scaleY ?? 1],
        dimensions: meta.dimensions,  // width, depth, height in meters
      } satisfies ViewerShape
    })
}`}
            />
          </CollapsibleSection>

          <CollapsibleSection title="3D Viewer" badge="R3F" defaultOpen={false}>
            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                <code className="text-brand-400 bg-gray-900 px-1 rounded">Planner3DViewer.tsx</code> renders the 
                Three.js scene declaratively with React Three Fiber. Uses drei for OrbitControls, Environment lighting, 
                and GLTF model loading.
              </p>
              <CodeBlock
                title="Planner3DViewer.tsx (simplified)"
                language="tsx"
                code={`import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { usePlannerStore } from '../store'
import { fabricToViewerShapes } from '../canvas-fabric/fabricToViewerShapes'
import { FurnitureModel } from './models/FurnitureModel'

export function Planner3DViewer() {
  const objects = usePlannerStore(s => s.objects)
  const shapes = fabricToViewerShapes(objects)

  return (
    <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
      <ambientLight intensity={0.4} />
      <directionalLight
        castShadow
        position={[5, 10, 5]}
        intensity={1}
      />
      <Environment preset="apartment" />
      <ContactShadows opacity={0.5} scale={20} blur={2} />

      {shapes.map(shape => (
        <FurnitureModel key={shape.id} shape={shape} />
      ))}

      <OrbitControls
        makeDefault
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  )
}`}
              />
            </div>
          </CollapsibleSection>
        </div>
      </section>

      {/* Catalog */}
      <section id="catalog" className="mb-12 scroll-mt-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-sky-500/10">
            <ShoppingBag size={20} className="text-sky-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Product Catalog</h2>
            <p className="text-xs text-gray-500">Furniture catalog with Supabase + R2 CDN</p>
          </div>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          The catalog stores product metadata in Supabase PostgreSQL while images and 3D models live in Cloudflare R2. 
          A CDN asset pipeline uploads, organizes, and audits assets. TanStack Query caches product lists client-side 
          with automatic invalidation on mutations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <CollapsibleSection title="Data Flow">
            <ul className="space-y-2 text-sm text-gray-400 list-disc list-inside">
              <li>Products stored in Supabase <code className="text-brand-400">products</code> table</li>
              <li>Image paths reference R2 object keys (not URLs)</li>
              <li>TanStack Query fetches with stale-while-revalidate</li>
              <li>Fuse.js for client-side fuzzy search</li>
              <li>Slug resolution via <code className="text-brand-400">lib/productSlugResolver.ts</code></li>
            </ul>
          </CollapsibleSection>
          <CollapsibleSection title="Asset Pipeline Scripts" defaultOpen={false}>
            <ul className="space-y-2 text-sm text-gray-400 list-disc list-inside">
              <li><code className="text-brand-400">catalog:ingest</code> — import catalog from source</li>
              <li><code className="text-brand-400">assets:cdn:upload</code> — push to R2</li>
              <li><code className="text-brand-400">assets:cdn:audit</code> — find broken paths</li>
              <li><code className="text-brand-400">catalog:organize:apply</code> — reorganize</li>
              <li><code className="text-brand-400">audit:supabase:catalog</code> — DB audit</li>
            </ul>
          </CollapsibleSection>
        </div>

        <div className="mt-4">
          <CodeBlock
            title="Catalog query with TanStack Query (pattern)"
            language="typescript"
            code={`import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export function useProducts(category?: string) {
  return useQuery({
    queryKey: ['products', category],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('id, slug, name, category, price, image_path, model_path')

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query.order('name')
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000,  // 5 min
    gcTime: 30 * 60 * 1000,     // 30 min garbage collect
  })
}`}
          />
        </div>
      </section>

      {/* CRM */}
      <section id="crm" className="mb-12 scroll-mt-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-green-500/10">
            <Users size={20} className="text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">CRM</h2>
            <p className="text-xs text-gray-500">Customer relationship management</p>
          </div>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          The CRM module manages customers, leads, and a sales pipeline. Recharts powers analytics dashboards 
          showing conversion rates, lead sources, and revenue tracking. All data is scoped to the authenticated 
          user via Supabase RLS.
        </p>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">CRM Capabilities</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              'Customer profiles with contact history',
              'Lead pipeline with stage tracking',
              'Sales analytics with Recharts',
              'Quote generation from planner exports',
              'Activity timeline per customer',
              'Team assignment and notes',
            ].map(cap => (
              <div key={cap} className="flex items-center gap-2 text-gray-400">
                <span className="w-1 h-1 rounded-full bg-green-400" />
                {cap}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Admin */}
      <section id="admin" className="mb-12 scroll-mt-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-violet-500/10">
            <Settings size={20} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Admin Dashboard</h2>
            <p className="text-xs text-gray-500">Catalog management and platform administration</p>
          </div>
        </div>

        <p className="text-sm text-gray-400">
          The admin dashboard provides CRUD operations for the product catalog, user management, and platform-wide 
          analytics. Access is restricted to admin-role users via RLS policies and middleware checks.
        </p>
      </section>
    </div>
  )
}
