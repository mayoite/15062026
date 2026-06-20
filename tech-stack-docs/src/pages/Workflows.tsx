import { MermaidDiagram } from '../components/MermaidDiagram'
import { CodeBlock } from '../components/CodeBlock'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { GitCommit, GitBranch, Rocket, Wrench, Database, Package } from 'lucide-react'

const gitFlow = `flowchart TB
    Main["main<br/>production"]
    Feature["feature/<name><br/>branch"]
    Dev["Local Dev<br/>npm.cmd run dev"]
    Test["Local Tests<br/>typecheck + test"]
    PR["Pull Request<br/>+ preview deploy"]
    Gate["release:gate<br/>CI checks"]
    Review["Code Review"]
    Merge["Merge to main"]
    Prod["Vercel Prod<br/>oando.co.in"]

    Main --> Feature
    Feature --> Dev
    Dev --> Test
    Test --> PR
    PR --> Gate
    PR --> Review
    Gate -->|pass| Review
    Review -->|approve| Merge
    Merge --> Prod
    Merge --> Main

    style Prod fill:#052e16,stroke:#22c55e
    style Gate fill:#2a0e0e,stroke:#f97316
    style PR fill:#1e1b2e,stroke:#a855f7`

const devWorkflow = [
  { step: '1', title: 'Create feature branch', cmd: 'git checkout -b feature/<name>', detail: 'Branch from main. Use descriptive names.' },
  { step: '2', title: 'Start dev server', cmd: 'npm.cmd run dev', detail: 'Webpack mode. Use dev:turbo for Turbopack (experimental).' },
  { step: '3', title: 'Make changes', cmd: '—', detail: 'Edit files under app/, features/, lib/, components/.' },
  { step: '4', title: 'Type check', cmd: 'npm.cmd run typecheck', detail: 'tsc -p tsconfig.json --noEmit (TS 6.x strict).' },
  { step: '5', title: 'Lint', cmd: 'npm.cmd run lint', detail: 'ESLint with zero warnings policy.' },
  { step: '6', title: 'Run tests', cmd: 'npm.cmd run test', detail: 'Vitest unit tests. Add test:planner for planner-only.' },
  { step: '7', title: 'Commit', cmd: 'git commit -m "feat: ..."', detail: 'Husky pre-commit runs lint-staged + secretlint.' },
  { step: '8', title: 'Push + PR', cmd: 'git push -u origin feature/<name>', detail: 'Create PR on GitHub. Vercel auto-deploys preview.' },
]

const commitConventions = [
  { type: 'feat', desc: 'New feature', example: 'feat(planner): add wall snap tool' },
  { type: 'fix', desc: 'Bug fix', example: 'fix(catalog): correct slug resolution for variants' },
  { type: 'docs', desc: 'Documentation', example: 'docs: update planner canvas architecture' },
  { type: 'style', desc: 'Formatting, no code change', example: 'style: apply prettier to features/planner' },
  { type: 'refactor', desc: 'Code restructuring', example: 'refactor(store): split planner store into slices' },
  { type: 'test', desc: 'Test additions', example: 'test(planner): add FabricDrawToolsBar tests' },
  { type: 'chore', desc: 'Build, deps, tooling', example: 'chore: bump fabric to 7.4.0' },
  { type: 'perf', desc: 'Performance improvement', example: 'perf(3d): instanced meshes for repeated furniture' },
]

const commonTasks = [
  { icon: Wrench, title: 'Add a new planner tool', steps: ['Create component in features/planner/canvas-fabric/', 'Add tool type to fabricDrawToolTypes.ts', 'Wire to Zustand store action', 'Add test under tests/planner/'] },
  { icon: Database, title: 'Add a database table', steps: ['Write SQL migration in config/database/migrations/', 'Add Drizzle schema definition', 'Enable RLS + write policies', 'Run db:apply + db:types to regenerate types'] },
  { icon: Package, title: 'Add a catalog product', steps: ['Run npm.cmd run catalog:ingest', 'Upload images: npm.cmd run assets:cdn:upload', 'Run npm.cmd run audit:supabase:catalog', 'Verify in planner library panel'] },
  { icon: Rocket, title: 'Deploy to production', steps: ['Ensure all tests pass locally', 'Create PR + get approval', 'Run npm.cmd run release:gate', 'Run npm.cmd run vercel:prod'] },
]

export function Workflows() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="section-heading">Development Workflows</h1>
        <p className="section-subheading">
          Git flow, daily dev loop, commit conventions, and common task guides.
        </p>
      </header>

      {/* Git flow */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-violet-500/10">
            <GitBranch size={20} className="text-violet-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Git Flow</h2>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Trunk-based development on <code className="text-brand-400">main</code>. Feature branches are short-lived. 
          Every PR gets a Vercel preview and runs the full release:gate.
        </p>
        <MermaidDiagram chart={gitFlow} title="Git Workflow" />
      </section>

      {/* Dev loop */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-sky-500/10">
            <GitCommit size={20} className="text-sky-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Daily Dev Loop</h2>
        </div>
        <div className="space-y-2">
          {devWorkflow.map(s => (
            <div key={s.step} className="card flex items-start gap-3 py-3">
              <div className="w-7 h-7 rounded-full bg-brand-500/15 text-brand-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {s.step}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-200">{s.title}</h3>
                {s.cmd !== '—' && (
                  <code className="text-xs font-mono text-brand-400 block mt-1">{s.cmd}</code>
                )}
                <p className="text-xs text-gray-500 mt-1">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Commit conventions */}
      <section className="mb-12">
        <CollapsibleSection title="Commit Message Conventions" badge="Conventional Commits">
          <p className="text-sm text-gray-400 mb-3">
            Follow <a href="https://www.conventionalcommits.org" target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">Conventional Commits</a>. 
            Scope is optional but encouraged for feature-specific changes.
          </p>
          <div className="space-y-2">
            {commitConventions.map(c => (
              <div key={c.type} className="flex items-start gap-3 p-3 bg-gray-950/50 rounded-lg border border-gray-800">
                <code className="text-xs font-mono text-amber-400 font-semibold flex-shrink-0 w-20">{c.type}</code>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-gray-400 block">{c.desc}</span>
                  <code className="text-xs font-mono text-gray-600 block mt-1 truncate">{c.example}</code>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <CodeBlock
              title="Example commit"
              language="bash"
              code={`git commit -m "feat(planner): add wall snap tool with grid alignment

- New FabricWallSnap utility in canvas-fabric/lib/
- Integrates with plannerStore for tool state
- Tests in tests/planner/wall-snap.test.ts
- Closes #142

Co-Authored-By: Oz <oz-agent@warp.dev>"`}
            />
          </div>
        </CollapsibleSection>
      </section>

      {/* PowerShell note */}
      <section className="mb-12">
        <div className="card border-amber-800/40 bg-amber-950/10">
          <h3 className="text-sm font-semibold text-amber-400 mb-2">PowerShell Note</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            On Windows PowerShell, use <code className="text-brand-400 bg-gray-900 px-1 rounded">npm.cmd</code> instead of 
            <code className="text-brand-400 bg-gray-900 px-1 rounded ml-1">npm</code>. The <code className="text-brand-400">npm</code> 
            alias can resolve to the PowerShell <code className="text-brand-400">npm</code> module which has different 
            argument parsing. All scripts in package.json are invoked as <code className="text-brand-400">npm.cmd run &lt;script&gt;</code>.
          </p>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-green-950/30 border border-green-800/40 rounded-lg p-2 text-green-400">
              ✓ npm.cmd run dev
            </div>
            <div className="bg-red-950/30 border border-red-800/40 rounded-lg p-2 text-red-400">
              ✗ npm run dev
            </div>
          </div>
        </div>
      </section>

      {/* Common tasks */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4">Common Task Guides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {commonTasks.map(task => {
            const Icon = task.icon
            return (
              <div key={task.title} className="card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-gray-800/50">
                    <Icon size={16} className="text-brand-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-200">{task.title}</h3>
                </div>
                <ol className="space-y-1.5">
                  {task.steps.map((step, i) => (
                    <li key={i} className="text-xs text-gray-500 flex items-start gap-2">
                      <span className="text-brand-500 font-mono flex-shrink-0">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )
          })}
        </div>
      </section>

      {/* Quality bar */}
      <section className="mb-12">
        <CollapsibleSection title="Quality Bar (from AGENTS.md)" badge="Must Pass">
          <div className="space-y-3 text-sm text-gray-400">
            <p>Before any code is considered done, these must pass:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                'npm.cmd run typecheck passes (tsc -p tsconfig.json, TS 6.x)',
                'npm.cmd run lint passes with zero warnings',
                'Relevant tests pass (vitest + playwright)',
                'No new secrets detected by secretlint',
                'Production build succeeds (~341 static pages)',
                'Accessibility audit passes (axe-core)',
              ].map(item => (
                <div key={item} className="flex items-start gap-2 text-xs text-gray-400 p-2 bg-gray-950/50 rounded-lg border border-gray-800">
                  <span className="text-green-400 flex-shrink-0">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </CollapsibleSection>
      </section>

      {/* Report format */}
      <section className="mb-12">
        <CollapsibleSection title="After-Meeting-Work Report Format" badge="AGENTS.md" defaultOpen={false}>
          <div className="space-y-3 text-sm text-gray-400">
            <p>Per AGENTS.md, report after meaningful work using this format:</p>
            <CodeBlock
              title="Report format"
              language="markdown"
              code={`**Done:** What was completed
**Verified:** How it was tested/verified
**Skipped:** What was intentionally skipped
**Risks:** Known risks or open questions
**Next:** Recommended next steps`}
            />
          </div>
        </CollapsibleSection>
      </section>
    </div>
  )
}
