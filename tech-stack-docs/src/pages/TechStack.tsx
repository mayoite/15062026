import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { techStack } from '../data/techStack'
import { CollapsibleSection } from '../components/CollapsibleSection'

const categoryOrder = [
  'Frontend',
  'Canvas & 3D',
  'Backend & DB',
  'AI & Integrations',
  'Validation',
  'Search',
  'Media',
  'Export',
  'Testing',
  'Tooling',
  'Deployment',
]

const categoryDescriptions: Record<string, string> = {
  'Frontend': 'Core UI framework and component libraries',
  'Canvas & 3D': '2D canvas drawing and 3D rendering for the planner',
  'Backend & DB': 'Database, authentication, and storage',
  'AI & Integrations': 'AI services and third-party integrations',
  'Validation': 'Schema validation and type safety',
  'Search': 'Client-side search capabilities',
  'Media': 'Image and document processing',
  'Export': 'PDF and image export functionality',
  'Testing': 'Unit, integration, and E2E testing',
  'Tooling': 'Build, lint, format, and CI tools',
  'Deployment': 'Hosting and deployment infrastructure',
}

export function TechStack() {
  const [filter, setFilter] = useState<string | null>(null)

  const filtered = filter ? techStack.filter(t => t.category === filter) : techStack

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="section-heading">Technology Stack</h1>
        <p className="section-subheading">
          Complete inventory of dependencies and their roles in the Oando Platform.
        </p>
      </header>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            !filter ? 'bg-brand-500 text-white' : 'bg-gray-900 text-gray-400 hover:text-gray-200 border border-gray-800'
          }`}
        >
          All ({techStack.length})
        </button>
        {categoryOrder.map(cat => {
          const count = techStack.filter(t => t.category === cat).length
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === cat ? 'bg-brand-500 text-white' : 'bg-gray-900 text-gray-400 hover:text-gray-200 border border-gray-800'
              }`}
            >
              {cat} ({count})
            </button>
          )
        })}
      </div>

      {/* Tech list grouped by category */}
      <div className="space-y-6">
        {(filter ? [filter] : categoryOrder).map(category => {
          const items = filtered.filter(t => t.category === category)
          if (items.length === 0) return null

          return (
            <div key={category}>
              <div className="flex items-baseline gap-3 mb-3">
                <h2 id={category.toLowerCase().replace(/[^a-z]+/g, '-')} className="text-lg font-bold text-white">
                  {category}
                </h2>
                <span className="text-xs text-gray-500">{categoryDescriptions[category]}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map(tech => (
                  <div key={tech.name} className="card hover:border-gray-700 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold ${tech.color}`}>
                          {tech.name.charAt(0)}
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-white text-sm truncate">{tech.name}</h3>
                          <span className="text-xs text-gray-500 font-mono">{tech.version}</span>
                        </div>
                      </div>
                      {tech.docs && (
                        <a
                          href={tech.docs}
                          target="_blank"
                          rel="noreferrer"
                          className="text-gray-500 hover:text-brand-400 transition-colors flex-shrink-0"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mb-2 leading-relaxed">{tech.description}</p>
                    <p className="text-xs text-gray-500 leading-relaxed border-l-2 border-gray-800 pl-2">
                      {tech.role}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Stack composition diagram */}
      <div className="mt-12">
        <CollapsibleSection title="Stack Composition" badge="Overview">
          <div className="space-y-3 text-sm text-gray-400">
            <p>
              The platform follows a layered architecture: <strong className="text-gray-300">UI layer</strong> (React, Radix, 
              Tailwind) at the top, <strong className="text-gray-300">interactive layer</strong> (Fabric canvas, R3F 3D, Zustand 
              state) in the middle, and <strong className="text-gray-300">data layer</strong> (Supabase, Drizzle, TanStack Query) 
              at the bottom.
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-gray-500">
              <li><span className="text-gray-300">UI Layer:</span> Next.js App Router, Radix primitives, Tailwind tokens, Motion, GSAP</li>
              <li><span className="text-gray-300">Interactive Layer:</span> Fabric.js canvas, React Three Fiber 3D, Zustand stores, Fuse.js search</li>
              <li><span className="text-gray-300">Data Layer:</span> Supabase (auth + DB), Drizzle ORM, TanStack Query, Cloudflare R2 storage</li>
              <li><span className="text-gray-300">Tooling Layer:</span> TypeScript 6.x strict, Vitest + Playwright, ESLint + Prettier, Husky hooks</li>
              <li><span className="text-gray-300">Deployment:</span> Vercel hosting, R2 CDN, secretlint for secret scanning</li>
            </ul>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  )
}
