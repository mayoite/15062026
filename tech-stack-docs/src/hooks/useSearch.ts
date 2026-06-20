import { useState, useMemo } from 'react'
import Fuse from 'fuse.js'

export interface SearchableItem {
  id: string
  title: string
  path: string
  content: string
  section: string
  tags?: string[]
}

const searchIndex: SearchableItem[] = [
  { id: 'overview', title: 'Overview', path: '/', section: 'Overview', content: 'Oando Platform furniture company Next.js planner catalog CRM admin tech stack overview', tags: ['overview', 'intro'] },
  { id: 'nextjs', title: 'Next.js', path: '/tech-stack#frontend', section: 'Tech Stack', content: 'Next.js App Router SSR SSG server components React framework version 16', tags: ['nextjs', 'framework', 'frontend'] },
  { id: 'react', title: 'React', path: '/tech-stack#frontend', section: 'Tech Stack', content: 'React 19 hooks context concurrent rendering UI library', tags: ['react', 'frontend'] },
  { id: 'typescript', title: 'TypeScript', path: '/tech-stack#frontend', section: 'Tech Stack', content: 'TypeScript 6.x type safety strict mode type checking', tags: ['typescript', 'types'] },
  { id: 'tailwind', title: 'Tailwind CSS', path: '/tech-stack#frontend', section: 'Tech Stack', content: 'Tailwind CSS v4 utility-first CSS design tokens theme', tags: ['tailwind', 'css', 'styling'] },
  { id: 'zustand', title: 'Zustand', path: '/tech-stack#frontend', section: 'Tech Stack', content: 'Zustand state management store planner canvas state', tags: ['zustand', 'state', 'store'] },
  { id: 'fabric', title: 'Fabric.js', path: '/tech-stack#canvas', section: 'Tech Stack', content: 'Fabric.js canvas 2D drawing floorplan room furniture placement', tags: ['fabric', 'canvas', '2d'] },
  { id: 'threejs', title: 'Three.js', path: '/tech-stack#canvas', section: 'Tech Stack', content: 'Three.js WebGL 3D graphics React Three Fiber R3F', tags: ['threejs', '3d', 'webgl'] },
  { id: 'supabase', title: 'Supabase', path: '/tech-stack#backend', section: 'Tech Stack', content: 'Supabase PostgreSQL auth database storage RLS Row Level Security', tags: ['supabase', 'database', 'auth'] },
  { id: 'drizzle', title: 'Drizzle ORM', path: '/tech-stack#backend', section: 'Tech Stack', content: 'Drizzle ORM TypeScript database migrations schema query builder', tags: ['drizzle', 'orm', 'database'] },
  { id: 'arch-overview', title: 'Architecture Overview', path: '/architecture', section: 'Architecture', content: 'flat-root Next.js app architecture feature modules app router', tags: ['architecture', 'structure'] },
  { id: 'planner', title: 'Planner Feature', path: '/features#planner', section: 'Features', content: 'planner floorplan canvas 2D 3D fabric three.js room furniture drag drop', tags: ['planner', 'canvas', 'feature'] },
  { id: 'catalog', title: 'Catalog Feature', path: '/features#catalog', section: 'Features', content: 'catalog product furniture search filter categories images', tags: ['catalog', 'products', 'feature'] },
  { id: 'crm', title: 'CRM Feature', path: '/features#crm', section: 'Features', content: 'CRM customers leads pipeline management recharts analytics', tags: ['crm', 'customers', 'feature'] },
  { id: 'database-schema', title: 'Database Schema', path: '/database', section: 'Database', content: 'PostgreSQL schema tables relations plans projects products users auth', tags: ['schema', 'database', 'tables'] },
  { id: 'api-routes', title: 'API Routes', path: '/api', section: 'API', content: 'API routes Next.js app router server actions validation zod', tags: ['api', 'routes', 'endpoints'] },
  { id: 'testing', title: 'Testing Strategy', path: '/testing', section: 'Testing', content: 'Vitest Playwright unit tests E2E tests coverage testing-library', tags: ['testing', 'vitest', 'playwright'] },
  { id: 'deployment', title: 'Deployment Pipeline', path: '/deployment', section: 'Deployment', content: 'Vercel deployment CI/CD preview production env variables', tags: ['deployment', 'vercel', 'ci-cd'] },
  { id: 'security', title: 'Security', path: '/security', section: 'Security', content: 'security RLS row level security auth CORS secrets secretlint', tags: ['security', 'auth', 'rls'] },
  { id: 'performance', title: 'Performance', path: '/performance', section: 'Performance', content: 'performance optimization image lazy loading CDN R2 caching', tags: ['performance', 'optimization', 'cdn'] },
  { id: 'workflows', title: 'Dev Workflows', path: '/workflows', section: 'Workflows', content: 'git workflow development commands typecheck lint test build', tags: ['workflow', 'git', 'commands'] },
  { id: 'code-org', title: 'Code Organization', path: '/code-organization', section: 'Code', content: 'module structure features app components lib config directory layout', tags: ['code', 'structure', 'modules'] },
]

export function useSearch() {
  const [query, setQuery] = useState('')

  const fuse = useMemo(() => new Fuse(searchIndex, {
    keys: ['title', 'content', 'tags'],
    threshold: 0.4,
    includeScore: true,
  }), [])

  const results = useMemo(() => {
    if (!query.trim()) return []
    return fuse.search(query).slice(0, 8).map(r => r.item)
  }, [fuse, query])

  return { query, setQuery, results }
}
