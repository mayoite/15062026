import { CodeBlock } from '../components/CodeBlock'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { Globe, Lock, Database, Zap } from 'lucide-react'

const apiRoutes = [
  { method: 'POST', path: '/api/auth/callback', desc: 'Supabase auth callback — exchanges code for session', auth: 'Public' },
  { method: 'POST', path: '/api/auth/signout', desc: 'Sign out — clears session cookie', auth: 'Authenticated' },
  { method: 'GET', path: '/api/catalog/products', desc: 'List products with optional category filter', auth: 'Public' },
  { method: 'GET', path: '/api/catalog/products/:slug', desc: 'Get single product by slug', auth: 'Public' },
  { method: 'POST', path: '/api/plans', desc: 'Create a new planner plan', auth: 'Authenticated' },
  { method: 'GET', path: '/api/plans', desc: 'List current user\'s plans', auth: 'Authenticated' },
  { method: 'GET', path: '/api/plans/:id', desc: 'Get a specific plan', auth: 'Owner only' },
  { method: 'PATCH', path: '/api/plans/:id', desc: 'Update plan data (auto-save)', auth: 'Owner only' },
  { method: 'DELETE', path: '/api/plans/:id', desc: 'Delete a plan', auth: 'Owner only' },
  { method: 'GET', path: '/api/crm/leads', desc: 'List leads assigned to user', auth: 'Authenticated' },
  { method: 'POST', path: '/api/crm/leads', desc: 'Create a new lead', auth: 'Authenticated' },
  { method: 'PATCH', path: '/api/crm/leads/:id', desc: 'Update lead stage or details', auth: 'Assigned' },
  { method: 'GET', path: '/api/admin/products', desc: 'Admin product listing (all)', auth: 'Admin' },
  { method: 'POST', path: '/api/admin/products', desc: 'Create product', auth: 'Admin' },
  { method: 'PATCH', path: '/api/admin/products/:id', desc: 'Update product', auth: 'Admin' },
  { method: 'DELETE', path: '/api/admin/products/:id', desc: 'Delete product', auth: 'Admin' },
]

const methodColors: Record<string, string> = {
  GET: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  POST: 'bg-brand-500/15 text-brand-400 border-brand-500/30',
  PATCH: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  DELETE: 'bg-red-500/15 text-red-400 border-red-500/30',
}

const authColors: Record<string, string> = {
  Public: 'text-gray-500',
  Authenticated: 'text-sky-400',
  'Owner only': 'text-amber-400',
  Assigned: 'text-amber-400',
  Admin: 'text-red-400',
}

const patterns = [
  {
    icon: Lock,
    title: 'Auth Check First',
    desc: 'Every protected route starts with getUser() and returns 401 if no session. Defense in depth alongside RLS.',
  },
  {
    icon: Database,
    title: 'Zod Validation',
    desc: 'All request bodies and query params validated with Zod schemas before touching the database. Fail fast.',
  },
  {
    icon: Zap,
    title: 'Server Actions',
    desc: 'Next.js Server Actions used for mutations alongside route handlers. Both follow the same validation pattern.',
  },
  {
    icon: Globe,
    title: 'Typed Responses',
    desc: 'Responses use a consistent { data, error } shape with TypeScript types matching the Supabase generated types.',
  },
]

export function ApiDesign() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="section-heading">API Design</h1>
        <p className="section-subheading">
          Next.js App Router API routes and Server Actions — endpoints, patterns, and validation.
        </p>
      </header>

      {/* Patterns */}
      <section id="patterns" className="mb-12 scroll-mt-4">
        <h2 className="text-xl font-bold text-white mb-4">Design Patterns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {patterns.map(p => {
            const Icon = p.icon
            return (
              <div key={p.title} className="card flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gray-800/50 flex-shrink-0">
                  <Icon size={16} className="text-brand-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-200 mb-1">{p.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Routes */}
      <section id="routes" className="mb-12 scroll-mt-4">
        <h2 className="text-xl font-bold text-white mb-4">API Routes</h2>
        <div className="card overflow-hidden p-0">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-1">Method</div>
            <div className="col-span-5">Path</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-2">Auth</div>
          </div>
          <div className="divide-y divide-gray-800">
            {apiRoutes.map(route => (
              <div key={`${route.method}-${route.path}`} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-gray-900/50 transition-colors">
                <div className="col-span-1">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-semibold border ${methodColors[route.method]}`}>
                    {route.method}
                  </span>
                </div>
                <code className="col-span-5 text-xs font-mono text-gray-300 truncate">{route.path}</code>
                <span className="col-span-4 text-xs text-gray-500 truncate">{route.desc}</span>
                <span className={`col-span-2 text-xs font-medium ${authColors[route.auth]}`}>{route.auth}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Routes are illustrative of the patterns in <code className="text-brand-400">app/api/*</code>. Actual paths 
          may vary — check the codebase for the live list.
        </p>
      </section>

      {/* Route handler example */}
      <section className="mb-12">
        <CollapsibleSection title="Route Handler Example" badge="app/api">
          <CodeBlock
            title="app/api/plans/route.ts (pattern)"
            language="typescript"
            code={`import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const CreatePlanSchema = z.object({
  name: z.string().min(1).max(100),
  data: z.record(z.unknown()),
})

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('plans')
    .select('id, name, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = CreatePlanSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('plans')
    .insert({ user_id: user.id, ...parsed.data })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}`}
          />
        </CollapsibleSection>
      </section>

      {/* Server Action example */}
      <section className="mb-12">
        <CollapsibleSection title="Server Action Example" badge="Mutation" defaultOpen={false}>
          <CodeBlock
            title="features/planner/persistence/savePlan.ts (pattern)"
            language="typescript"
            code={`'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const SavePlanSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  data: z.record(z.unknown()),
})

export async function savePlan(input: z.infer<typeof SavePlanSchema>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const parsed = SavePlanSchema.parse(input)

  if (parsed.id) {
    // Update existing (RLS ensures ownership)
    const { error } = await supabase
      .from('plans')
      .update({ name: parsed.name, data: parsed.data, updated_at: new Date().toISOString() })
      .eq('id', parsed.id)
      .eq('user_id', user.id)

    if (error) throw error
    revalidatePath('/planner')
    return { id: parsed.id }
  }

  // Create new
  const { data, error } = await supabase
    .from('plans')
    .insert({ user_id: user.id, name: parsed.name, data: parsed.data })
    .select('id')
    .single()

  if (error) throw error
  revalidatePath('/planner')
  return { id: data.id }
}`}
          />
        </CollapsibleSection>
      </section>

      {/* Error handling */}
      <section className="mb-12">
        <CollapsibleSection title="Error Response Convention" badge="Consistency" defaultOpen={false}>
          <div className="space-y-3">
            <p className="text-sm text-gray-400">
              All API responses follow a consistent shape. Errors include a message and optional details for 
              validation errors.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <CodeBlock
                title="Success response"
                language="json"
                code={`{
  "data": {
    "id": "uuid-here",
    "name": "Living Room",
    "updated_at": "2026-06-20T..."
  }
}`}
              />
              <CodeBlock
                title="Error response"
                language="json"
                code={`{
  "error": "Validation failed",
  "details": {
    "fieldErrors": {
      "name": ["String must contain at least 1 character(s)"]
    }
  }
}`}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="card p-3"><div className="text-emerald-400 font-semibold">200</div><div className="text-gray-500">Success</div></div>
              <div className="card p-3"><div className="text-brand-400 font-semibold">201</div><div className="text-gray-500">Created</div></div>
              <div className="card p-3"><div className="text-amber-400 font-semibold">400/401</div><div className="text-gray-500">Client error</div></div>
              <div className="card p-3"><div className="text-red-400 font-semibold">500</div><div className="text-gray-500">Server error</div></div>
            </div>
          </div>
        </CollapsibleSection>
      </section>
    </div>
  )
}
