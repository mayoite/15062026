import { CodeBlock } from '../components/CodeBlock'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { Shield, Lock, Key, Eye, AlertTriangle, RefreshCw } from 'lucide-react'

const securityLayers = [
  {
    icon: Lock,
    name: 'Authentication',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    points: [
      'Supabase Auth with magic link (OTP) email',
      'Session cookies validated in Next.js middleware',
      'No passwords stored — OTP only',
      'Cookie-based sessions (not localStorage tokens)',
    ],
  },
  {
    icon: Shield,
    name: 'Authorization (RLS)',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    points: [
      'Row Level Security on all user-data tables',
      'Policies enforce auth.uid() = user_id',
      'Admin role checks for admin endpoints',
      'Defense in depth — middleware + RLS + app checks',
    ],
  },
  {
    icon: Key,
    name: 'Secrets Management',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    points: [
      'Server-only keys via "server-only" import',
      'NEXT_PUBLIC_ prefix for client-safe vars only',
      'secretlint scans all files pre-commit',
      'Vercel encrypted env vars (never in git)',
    ],
  },
  {
    icon: Eye,
    name: 'Input Validation',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    points: [
      'Zod schemas validate all API inputs',
      'Server Actions validate before mutation',
      'No raw user input reaches SQL',
      'Supabase client parameterizes queries',
    ],
  },
  {
    icon: RefreshCw,
    name: 'Rate Limiting',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    points: [
      'lib/rateLimit.ts for API route protection',
      'Per-IP and per-user limits',
      'Auth endpoints have stricter limits',
      'Prevents brute force on magic link requests',
    ],
  },
  {
    icon: AlertTriangle,
    name: 'Auditing',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    points: [
      'db:advisors:security runs Supabase security advisor',
      'audit:supabase:admin for admin endpoint audit',
      'scan:secrets for additional secret scanning',
      'Regular RLS policy reviews',
    ],
  },
]

export function Security() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="section-heading">Security Practices</h1>
        <p className="section-subheading">
          Defense-in-depth security: authentication, Row Level Security, secrets management, and input validation.
        </p>
      </header>

      {/* Security layers */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4">Security Layers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {securityLayers.map(layer => {
            const Icon = layer.icon
            return (
              <div key={layer.name} className="card">
                <div className={`p-2.5 rounded-xl ${layer.bg} inline-flex mb-3`}>
                  <Icon size={20} className={layer.color} />
                </div>
                <h3 className="font-semibold text-white text-sm mb-2">{layer.name}</h3>
                <ul className="space-y-1.5">
                  {layer.points.map(p => (
                    <li key={p} className="text-xs text-gray-500 flex items-start gap-1.5">
                      <span className={`w-1 h-1 rounded-full ${layer.color.replace('text', 'bg')} mt-1.5 flex-shrink-0`} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      {/* Supabase server client */}
      <section className="mb-12">
        <CollapsibleSection title="Server-Side Supabase Client" badge="Server-Only">
          <p className="text-sm text-gray-400 mb-3">
            The server client uses the service role key and is protected by the <code className="text-brand-400">"server-only"</code> 
            import — any accidental client import fails at build time.
          </p>
          <CodeBlock
            title="lib/supabase/server.ts (pattern)"
            language="typescript"
            code={`import 'server-only'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { env } from '@/lib/env.server'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

// Admin client with service role — use sparingly, never expose to client
export function createAdminClient() {
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}`}
          />
        </CollapsibleSection>
      </section>

      {/* RLS policy */}
      <section className="mb-12">
        <CollapsibleSection title="RLS Policy Pattern" badge="PostgreSQL" defaultOpen={false}>
          <p className="text-sm text-gray-400 mb-3">
            Every user-owned table gets four policies: SELECT, INSERT, UPDATE, DELETE — all scoped to 
            <code className="text-brand-400">auth.uid() = user_id</code>.
          </p>
          <CodeBlock
            title="migration: enable_rls_plans.sql"
            language="sql"
            code={`-- Enable RLS
alter table public.plans enable row level security;

-- SELECT: users see only their own rows
create policy "plans_select_own"
  on public.plans for select
  to authenticated
  using (auth.uid() = user_id);

-- INSERT: users can only create rows they own
create policy "plans_insert_own"
  on public.plans for insert
  to authenticated
  with check (auth.uid() = user_id);

-- UPDATE: users can only update their own rows
create policy "plans_update_own"
  on public.plans for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE: users can only delete their own rows
create policy "plans_delete_own"
  on public.plans for delete
  to authenticated
  using (auth.uid() = user_id);

-- Admin policies (separate role)
create policy "plans_admin_all"
  on public.plans for all
  to service_role
  using (true)
  with check (true);`}
          />
        </CollapsibleSection>
      </section>

      {/* Rate limiting */}
      <section className="mb-12">
        <CollapsibleSection title="Rate Limiting" badge="lib/rateLimit.ts" defaultOpen={false}>
          <CodeBlock
            title="lib/rateLimit.ts (pattern)"
            language="typescript"
            code={`import 'server-only'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

interface RateLimitOptions {
  intervalMs: number
  maxRequests: number
}

export function rateLimit(
  key: string,
  opts: RateLimitOptions
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + opts.intervalMs })
    return { success: true, remaining: opts.maxRequests - 1, resetAt: now + opts.intervalMs }
  }

  if (entry.count >= opts.maxRequests) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { success: true, remaining: opts.maxRequests - entry.count, resetAt: entry.resetAt }
}

// Usage in API route:
// const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
// const { success } = rateLimit(\`auth:\${ip}\`, { intervalMs: 60_000, maxRequests: 5 })
// if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })`}
          />
        </CollapsibleSection>
      </section>

      {/* Secret scanning */}
      <section className="mb-12">
        <CollapsibleSection title="Secret Scanning" badge="Pre-commit" defaultOpen={false}>
          <div className="space-y-3">
            <p className="text-sm text-gray-400">
              <code className="text-brand-400">secretlint</code> scans all files for accidental secret leaks 
              and runs as the first step in <code className="text-brand-400">release:gate</code>.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="card">
                <h4 className="text-sm font-semibold text-gray-200 mb-1">Pre-commit Hook</h4>
                <p className="text-xs text-gray-500">
                  Husky + lint-staged run secretlint on staged files before each commit.
                </p>
              </div>
              <div className="card">
                <h4 className="text-sm font-semibold text-gray-200 mb-1">Release Gate</h4>
                <p className="text-xs text-gray-500">
                  <code className="text-brand-400">lint:secrets</code> scans the whole repo before any deployment.
                </p>
              </div>
            </div>
            <CodeBlock
              title=".husky/pre-commit"
              language="bash"
              code={`#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged`}
            />
          </div>
        </CollapsibleSection>
      </section>

      {/* Security checklist */}
      <section className="mb-12">
        <div className="card border-green-800/40 bg-green-950/10">
          <h3 className="text-sm font-semibold text-green-400 mb-3">Security Checklist</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              'RLS enabled on all user-data tables',
              'Service role key never exposed to client',
              'All API inputs validated with Zod',
              'Auth cookies httpOnly + secure',
              'CORS configured for known origins only',
              'Rate limiting on auth + write endpoints',
              'secretlint in pre-commit + release:gate',
              'No secrets in git history (scan:secrets)',
              'Admin routes check role in middleware + RLS',
              'Dependencies kept updated (npm audit)',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-xs text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
