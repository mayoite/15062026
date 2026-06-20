import { MermaidDiagram } from '../components/MermaidDiagram'
import { CodeBlock } from '../components/CodeBlock'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { Rocket, Cloud, Key, GitPullRequest } from 'lucide-react'

const pipelineDiagram = `flowchart LR
    Dev["Local Dev<br/>npm.cmd run dev"]
    Commit["Git Commit<br/>+ push"]
    PR["Pull Request<br/>on GitHub"]
    Preview["Vercel Preview<br/>Deployment"]
    Gate["release:gate<br/>CI checks"]
    Review{"Code<br/>Review"}
    Main["Merge to main"]
    Prod["Vercel Prod<br/>oando.co.in"]

    Dev --> Commit
    Commit --> PR
    PR --> Preview
    PR --> Gate
    Gate --> Review
    Preview --> Review
    Review -->|approve| Main
    Main --> Prod

    style Preview fill:#1e1b2e,stroke:#a855f7
    style Prod fill:#052e16,stroke:#22c55e
    style Gate fill:#2a0e0e,stroke:#f97316`

const envVars = [
  { name: 'NEXT_PUBLIC_SUPABASE_URL', scope: 'Public', desc: 'Supabase project URL' },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', scope: 'Public', desc: 'Supabase anon key (safe for client)' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', scope: 'Server', desc: 'Service role key (server-only, never exposed)' },
  { name: 'DATABASE_URL', scope: 'Server', desc: 'Direct Postgres connection for Drizzle/scripts' },
  { name: 'R2_ACCOUNT_ID', scope: 'Server', desc: 'Cloudflare account ID' },
  { name: 'R2_ACCESS_KEY_ID', scope: 'Server', desc: 'R2 access key' },
  { name: 'R2_SECRET_ACCESS_KEY', scope: 'Server', desc: 'R2 secret key' },
  { name: 'R2_BUCKET_NAME', scope: 'Server', desc: 'oando-asset-cdn bucket' },
  { name: 'OPENAI_API_KEY', scope: 'Server', desc: 'OpenAI API key for AI features' },
  { name: 'GOOGLE_AI_API_KEY', scope: 'Server', desc: 'Google Gemini API key' },
  { name: 'NEXT_PUBLIC_SITE_URL', scope: 'Public', desc: 'Canonical site URL (oando.co.in)' },
  { name: 'VERCEL_ENV', scope: 'Auto', desc: 'Set by Vercel (production/preview/development)' },
]

const pipelineSteps = [
  { step: '1', name: 'lint:secrets', desc: 'Scan for leaked secrets with secretlint', tool: 'secretlint' },
  { step: '2', name: 'lint', desc: 'ESLint with zero warnings policy', tool: 'eslint' },
  { step: '3', name: 'typecheck', desc: 'TypeScript 6.x type checking (no emit)', tool: 'tsc' },
  { step: '4', name: 'test', desc: 'Vitest unit test suite', tool: 'vitest' },
  { step: '5', name: 'build', desc: 'Next.js production build (~341 static pages)', tool: 'next build' },
  { step: '6', name: 'test:a11y', desc: 'Playwright accessibility audit (axe-core)', tool: 'playwright' },
  { step: '7', name: 'test:e2e:nav', desc: 'Navigation smoke E2E tests', tool: 'playwright' },
  { step: '8', name: 'test:planner-catalog', desc: 'Planner catalog + chrome E2E', tool: 'playwright' },
  { step: '9', name: 'test:coverage:planner', desc: 'Planner coverage report', tool: 'vitest' },
  { step: '10', name: 'test:coverage:site', desc: 'Site coverage report', tool: 'vitest' },
]

export function Deployment() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="section-heading">Deployment</h1>
        <p className="section-subheading">
          Vercel hosting with a strict release gate pipeline. Preview deployments on every PR, production on main.
        </p>
      </header>

      {/* Pipeline overview */}
      <section id="pipeline" className="mb-12 scroll-mt-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-orange-500/10">
            <GitPullRequest size={20} className="text-orange-400" />
          </div>
          <h2 className="text-xl font-bold text-white">CI/CD Pipeline</h2>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Every pull request triggers a Vercel preview deployment and runs the release:gate checks. Only after 
          review and merge to main does the production deployment to oando.co.in happen.
        </p>
        <MermaidDiagram chart={pipelineDiagram} title="Deployment Pipeline" />
      </section>

      {/* Release gate steps */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-amber-500/10">
            <Rocket size={20} className="text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Release Gate Steps</h2>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          The <code className="text-brand-400 bg-gray-900 px-1 rounded">release:gate</code> npm script chains these 
          10 checks in order. All must pass.
        </p>
        <div className="space-y-2">
          {pipelineSteps.map(s => (
            <div key={s.step} className="card flex items-center gap-3 py-3">
              <div className="w-7 h-7 rounded-full bg-brand-500/15 text-brand-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {s.step}
              </div>
              <div className="flex-1 min-w-0">
                <code className="text-sm font-mono text-gray-200">{s.name}</code>
                <p className="text-xs text-gray-500">{s.desc}</p>
              </div>
              <span className="badge bg-gray-800 text-gray-400 border border-gray-700 flex-shrink-0">{s.tool}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Vercel */}
      <section id="vercel" className="mb-12 scroll-mt-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-gray-500/10">
            <Cloud size={20} className="text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-white">Vercel Hosting</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-200 mb-2">Preview Deployments</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Every PR gets an isolated preview URL. <code className="text-brand-400">npm.cmd run vercel:preview</code> 
              deploys from CLI with <code className="text-brand-400">--yes</code> flag for non-interactive.
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-200 mb-2">Production Deploy</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              <code className="text-brand-400">npm.cmd run vercel:prod</code> runs the full release:gate first, 
              then deploys to production with <code className="text-brand-400">--prod --yes</code>.
            </p>
          </div>
        </div>

        <CollapsibleSection title="Vercel Configuration" badge="vercel.json" defaultOpen={false}>
          <CodeBlock
            title="vercel.json (pattern)"
            language="json"
            code={`{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["bom1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ],
  "redirects": [
    { "source": "/home", "destination": "/", "permanent": true }
  ]
}`}
          />
        </CollapsibleSection>
      </section>

      {/* Env vars */}
      <section id="env-vars" className="mb-12 scroll-mt-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-red-500/10">
            <Key size={20} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Environment Variables</h2>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Variables are set in Vercel project settings. Server-scoped vars are encrypted and never exposed to the 
          client bundle. The <code className="text-brand-400">NEXT_PUBLIC_</code> prefix marks client-safe vars.
        </p>

        <div className="card overflow-hidden p-0">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-5">Variable</div>
            <div className="col-span-2">Scope</div>
            <div className="col-span-5">Description</div>
          </div>
          <div className="divide-y divide-gray-800">
            {envVars.map(v => (
              <div key={v.name} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center">
                <code className="col-span-5 text-xs font-mono text-brand-400 truncate">{v.name}</code>
                <span className={`col-span-2 text-xs font-medium ${
                  v.scope === 'Public' ? 'text-sky-400' :
                  v.scope === 'Server' ? 'text-amber-400' :
                  'text-gray-500'
                }`}>{v.scope}</span>
                <span className="col-span-5 text-xs text-gray-500 truncate">{v.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <CollapsibleSection title="Environment Validation (Zod)" badge="Fail Fast" defaultOpen={false}>
            <CodeBlock
              title="lib/env.server.ts (pattern)"
              language="typescript"
              code={`import { z } from 'zod'
import 'server-only'

const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().url(),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1).optional(),
  GOOGLE_AI_API_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
})

function loadEnv() {
  const parsed = EnvSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:')
    console.error(parsed.error.flatten().fieldErrors)
    throw new Error('Invalid environment variables — check Vercel project settings')
  }
  return parsed.data
}

export const env = loadEnv()`}
            />
          </CollapsibleSection>
        </div>
      </section>

      {/* CDN */}
      <section className="mb-12">
        <CollapsibleSection title="CDN Asset Pipeline" badge="Cloudflare R2">
          <div className="space-y-3 text-sm text-gray-400">
            <p>
              Static catalog assets (product images, 3D GLTF models) are stored in Cloudflare R2 bucket 
              <code className="text-brand-400 bg-gray-900 px-1 rounded">oando-asset-cdn</code> and served via R2's 
              public CDN. Zero egress fees make this cost-effective for high-traffic image serving.
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-gray-500">
              <li><code className="text-brand-400">assets:cdn:upload</code> — push local assets to R2</li>
              <li><code className="text-brand-400">assets:cdn:upload:incremental</code> — skip existing</li>
              <li><code className="text-brand-400">assets:r2:create-bucket</code> — create bucket if missing</li>
              <li><code className="text-brand-400">assets:cdn:audit</code> — find broken paths</li>
              <li><code className="text-brand-400">assets:cdn:fix</code> — auto-fix broken paths (with --apply)</li>
            </ul>
          </div>
        </CollapsibleSection>
      </section>
    </div>
  )
}
