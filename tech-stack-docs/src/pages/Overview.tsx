import { Link } from 'react-router-dom'
import {
  Layers, GitBranch, Puzzle, Database, Globe,
  TestTube, Rocket, Shield, Zap, ArrowRight, Code
} from 'lucide-react'

const stats = [
  { label: 'Dependencies', value: '40+' },
  { label: 'Static Pages', value: '~341' },
  { label: 'TypeScript', value: '6.x' },
  { label: 'Test Suites', value: '3' },
]

const sections = [
  { icon: Layers, label: 'Tech Stack', path: '/tech-stack', color: 'text-sky-400', bg: 'bg-sky-500/10', desc: 'All 40+ libraries and their roles' },
  { icon: GitBranch, label: 'Architecture', path: '/architecture', color: 'text-violet-400', bg: 'bg-violet-500/10', desc: 'App structure, data flow, auth' },
  { icon: Puzzle, label: 'Features', path: '/features', color: 'text-amber-400', bg: 'bg-amber-500/10', desc: 'Planner, Catalog, CRM, Admin' },
  { icon: Database, label: 'Database', path: '/database', color: 'text-green-400', bg: 'bg-green-500/10', desc: 'PostgreSQL schema & Drizzle ORM' },
  { icon: Globe, label: 'API Design', path: '/api', color: 'text-pink-400', bg: 'bg-pink-500/10', desc: 'Routes, patterns, validation' },
  { icon: TestTube, label: 'Testing', path: '/testing', color: 'text-yellow-400', bg: 'bg-yellow-500/10', desc: 'Vitest, Playwright, coverage' },
  { icon: Rocket, label: 'Deployment', path: '/deployment', color: 'text-orange-400', bg: 'bg-orange-500/10', desc: 'Vercel CI/CD pipeline' },
  { icon: Shield, label: 'Security', path: '/security', color: 'text-red-400', bg: 'bg-red-500/10', desc: 'RLS, auth, secrets management' },
  { icon: Zap, label: 'Performance', path: '/performance', color: 'text-cyan-400', bg: 'bg-cyan-500/10', desc: 'CDN, caching, optimization' },
  { icon: Code, label: 'Code Organization', path: '/code-organization', color: 'text-indigo-400', bg: 'bg-indigo-500/10', desc: 'Module structure & conventions' },
]

const keyTech = [
  { name: 'Next.js 16', tag: 'Framework', color: 'bg-gray-800 text-gray-300' },
  { name: 'React 19', tag: 'UI', color: 'bg-cyan-950 text-cyan-300' },
  { name: 'TypeScript 6', tag: 'Language', color: 'bg-blue-950 text-blue-300' },
  { name: 'Fabric.js 7', tag: '2D Canvas', color: 'bg-amber-950 text-amber-300' },
  { name: 'Three.js / R3F', tag: '3D', color: 'bg-gray-900 text-gray-300' },
  { name: 'Supabase', tag: 'Backend', color: 'bg-green-950 text-green-300' },
  { name: 'Drizzle ORM', tag: 'DB', color: 'bg-yellow-950 text-yellow-300' },
  { name: 'Zustand 5', tag: 'State', color: 'bg-orange-950 text-orange-300' },
  { name: 'Tailwind 4', tag: 'CSS', color: 'bg-sky-950 text-sky-300' },
  { name: 'Vercel', tag: 'Deploy', color: 'bg-gray-900 text-gray-300' },
  { name: 'Vitest 4', tag: 'Testing', color: 'bg-yellow-900 text-yellow-300' },
  { name: 'Playwright', tag: 'E2E', color: 'bg-emerald-950 text-emerald-300' },
]

export function Overview() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Hero */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
          Oando Platform · Tech Stack Documentation
        </div>
        <h1 className="text-4xl font-bold text-white mb-3 leading-tight">
          Oando Platform
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-400"> Tech Stack</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
          A comprehensive furniture platform at <code className="text-brand-400 bg-gray-900 px-1.5 py-0.5 rounded text-sm">oando.co.in</code> — featuring
          a 2D/3D room planner, product catalog, CRM, and admin dashboard built with modern web technology.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          {stats.map(s => (
            <div key={s.label} className="card text-center">
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Technologies */}
      <div className="mb-12">
        <h2 className="text-lg font-bold text-white mb-4">Key Technologies</h2>
        <div className="flex flex-wrap gap-2">
          {keyTech.map(tech => (
            <span
              key={tech.name}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-white/5 ${tech.color}`}
            >
              {tech.name}
              <span className="text-xs opacity-60">{tech.tag}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Project Description */}
      <div className="card mb-12">
        <h2 className="text-lg font-semibold text-white mb-3">About the Platform</h2>
        <div className="space-y-3 text-gray-400 text-sm leading-relaxed">
          <p>
            The Oando Platform is a flat-root <strong className="text-gray-300">Next.js 16 application</strong> serving a furniture 
            company's complete digital presence. The codebase uses a single monorepo structure with feature-based module 
            organization under <code className="text-brand-400 bg-gray-900 px-1 rounded">features/</code> and the Next.js App Router 
            under <code className="text-brand-400 bg-gray-900 px-1 rounded">app/</code>.
          </p>
          <p>
            The centerpiece is the <strong className="text-gray-300">Room Planner</strong> — a sophisticated 2D/3D floorplan designer 
            powered by <strong className="text-gray-300">Fabric.js</strong> (canvas drawing, furniture placement, wall tools) combined 
            with <strong className="text-gray-300">React Three Fiber</strong> for real-time 3D preview. The planner integrates 
            directly with the product catalog via Supabase.
          </p>
          <p>
            The platform also includes a <strong className="text-gray-300">Product Catalog</strong> with Cloudflare R2 CDN assets, 
            a <strong className="text-gray-300">CRM module</strong> for customer management, an <strong className="text-gray-300">Admin 
            dashboard</strong>, and a fully SEO-optimized marketing site.
          </p>
        </div>
      </div>

      {/* Navigation Grid */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Documentation Sections</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sections.map(section => {
            const Icon = section.icon
            return (
              <Link
                key={section.path}
                to={section.path}
                className="card group flex items-start gap-4 hover:border-gray-700 transition-colors cursor-pointer"
              >
                <div className={`p-2.5 rounded-xl ${section.bg} flex-shrink-0`}>
                  <Icon size={20} className={section.color} />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-200 group-hover:text-white transition-colors flex items-center gap-1">
                    {section.label}
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">{section.desc}</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Quick Commands */}
      <div className="mt-12 card">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Start Commands</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-sm">
          {[
            { cmd: 'npm.cmd run dev', desc: 'Start dev server (webpack mode)' },
            { cmd: 'npm.cmd run typecheck', desc: 'TypeScript check (TS 6.x)' },
            { cmd: 'npm.cmd run lint', desc: 'ESLint (zero warnings)' },
            { cmd: 'npm.cmd run test', desc: 'Run Vitest unit tests' },
            { cmd: 'npm.cmd run test:planner', desc: 'Planner-specific tests' },
            { cmd: 'npm.cmd run test:e2e:nav', desc: 'Playwright navigation smoke' },
            { cmd: 'npm.cmd run build', desc: 'Production build' },
            { cmd: 'npm.cmd run release:gate', desc: 'Full pre-release pipeline' },
          ].map(({ cmd, desc }) => (
            <div key={cmd} className="flex flex-col gap-1 p-3 bg-gray-900/50 rounded-lg border border-gray-800">
              <code className="text-brand-400 text-xs">{cmd}</code>
              <span className="text-gray-500 text-xs font-sans">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
