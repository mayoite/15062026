import { CodeBlock } from '../components/CodeBlock'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { CheckSquare, Play, BarChart, AlertTriangle } from 'lucide-react'

const testCommands = [
  { cmd: 'npm.cmd run test', desc: 'Run all Vitest unit tests', scope: 'Vitest' },
  { cmd: 'npm.cmd run test:watch', desc: 'Watch mode', scope: 'Vitest' },
  { cmd: 'npm.cmd run test:ui', desc: 'Vitest UI dashboard', scope: 'Vitest' },
  { cmd: 'npm.cmd run test:coverage', desc: 'Run with V8 coverage', scope: 'Vitest' },
  { cmd: 'npm.cmd run test:planner', desc: 'Planner-only tests', scope: 'Vitest' },
  { cmd: 'npm.cmd run test:unit', desc: 'Exclude planner tests', scope: 'Vitest' },
  { cmd: 'npm.cmd run test:planner-catalog', desc: 'Playwright planner + catalog E2E', scope: 'Playwright' },
  { cmd: 'npm.cmd run test:e2e:nav', desc: 'Navigation smoke E2E', scope: 'Playwright' },
  { cmd: 'npm.cmd run test:a11y', desc: 'Accessibility (axe-core) E2E', scope: 'Playwright' },
  { cmd: 'npm.cmd run release:gate', desc: 'Full pre-release pipeline', scope: 'All' },
]

const testLayers = [
  {
    icon: CheckSquare,
    name: 'Unit Tests',
    tool: 'Vitest 4 + @testing-library/react',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    desc: 'Pure logic and component tests. Run in happy-dom or jsdom. Fast feedback loop.',
    examples: ['Planner geometry math', 'Catalog transforms', 'Slug resolution', 'Form validation logic', 'Zustand store actions'],
  },
  {
    icon: Play,
    name: 'E2E Tests',
    tool: 'Playwright 1.61 + axe-core',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    desc: 'Browser-driven integration tests. Real navigation, clicks, and assertions against a running dev server.',
    examples: ['Site navigation smoke', 'Planner catalog spec', 'Planner guest workspace', 'Planner custom tools', 'Accessibility audits'],
  },
  {
    icon: BarChart,
    name: 'Coverage',
    tool: '@vitest/coverage-v8',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    desc: 'V8 native coverage. Separate configs for planner vs site. Enforced in release:gate.',
    examples: ['test:coverage:planner', 'test:coverage:site', 'Branch + line coverage', 'Per-file reporting'],
  },
]

export function Testing() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="section-heading">Testing Strategy</h1>
        <p className="section-subheading">
          A three-layer approach: Vitest unit tests, Playwright E2E, and V8 coverage — all gated before release.
        </p>
      </header>

      {/* Test layers */}
      <section className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {testLayers.map(layer => {
            const Icon = layer.icon
            return (
              <div key={layer.name} className="card">
                <div className={`p-2.5 rounded-xl ${layer.bg} inline-flex mb-3`}>
                  <Icon size={20} className={layer.color} />
                </div>
                <h3 className="font-semibold text-white text-sm mb-1">{layer.name}</h3>
                <code className="text-xs text-gray-500 font-mono block mb-2">{layer.tool}</code>
                <p className="text-xs text-gray-400 leading-relaxed mb-3">{layer.desc}</p>
                <ul className="space-y-1">
                  {layer.examples.map(ex => (
                    <li key={ex} className="text-xs text-gray-500 flex items-center gap-1.5">
                      <span className={`w-1 h-1 rounded-full ${layer.color.replace('text', 'bg')}`} />
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      {/* Commands */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4">Test Commands</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {testCommands.map(({ cmd, desc, scope }) => (
            <div key={cmd} className="card flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <code className="text-brand-400 text-xs font-mono">{cmd}</code>
                <span className={`badge ${
                  scope === 'Vitest' ? 'bg-yellow-500/15 text-yellow-400' :
                  scope === 'Playwright' ? 'bg-green-500/15 text-green-400' :
                  'bg-violet-500/15 text-violet-400'
                }`}>{scope}</span>
              </div>
              <span className="text-gray-500 text-xs">{desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Unit test example */}
      <section id="unit" className="mb-12 scroll-mt-4">
        <CollapsibleSection title="Unit Test Example (Vitest)" badge="Vitest">
          <CodeBlock
            title="tests/planner/geometry.test.ts (pattern)"
            language="typescript"
            code={`import { describe, it, expect } from 'vitest'
import { snapToGrid, rotatePoint, boundingBox } from '@/features/planner/shared/geometry'

describe('snapToGrid', () => {
  it('snaps to nearest grid point', () => {
    expect(snapToGrid(13, 10)).toBe(10)
    expect(snapToGrid(17, 10)).toBe(20)
    expect(snapToGrid(25, 10)).toBe(30)
  })

  it('handles negative values', () => {
    expect(snapToGrid(-13, 10)).toBe(-10)
    expect(snapToGrid(-17, 10)).toBe(-20)
  })
})

describe('rotatePoint', () => {
  it('rotates 90 degrees around origin', () => {
    const result = rotatePoint({ x: 10, y: 0 }, 90, { x: 0, y: 0 })
    expect(result.x).toBeCloseTo(0, 5)
    expect(result.y).toBeCloseTo(10, 5)
  })
})

describe('boundingBox', () => {
  it('computes box from multiple points', () => {
    const box = boundingBox([
      { x: 0, y: 0 },
      { x: 100, y: 50 },
      { x: 30, y: 80 },
    ])
    expect(box).toEqual({ x: 0, y: 0, width: 100, height: 80 })
  })
})`}
          />
        </CollapsibleSection>
      </section>

      {/* Component test example */}
      <section className="mb-12">
        <CollapsibleSection title="Component Test Example" badge="RTL" defaultOpen={false}>
          <CodeBlock
            title="tests/planner/FabricDrawToolsBar.test.tsx (pattern)"
            language="tsx"
            code={`import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FabricDrawToolsBar } from '@/features/planner/canvas-fabric/FabricDrawToolsBar'

describe('FabricDrawToolsBar', () => {
  it('renders all tool buttons', () => {
    render(<FabricDrawToolsBar activeTool="select" onToolChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /select/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /wall/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /draw/i })).toBeInTheDocument()
  })

  it('calls onToolChange when clicked', async () => {
    const user = userEvent.setup()
    const onToolChange = vi.fn()
    render(<FabricDrawToolsBar activeTool="select" onToolChange={onToolChange} />)

    await user.click(screen.getByRole('button', { name: /wall/i }))
    expect(onToolChange).toHaveBeenCalledWith('wall')
  })

  it('marks active tool with aria-pressed', () => {
    render(<FabricDrawToolsBar activeTool="wall" onToolChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /wall/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /select/i })).toHaveAttribute('aria-pressed', 'false')
  })
})`}
          />
        </CollapsibleSection>
      </section>

      {/* E2E test example */}
      <section id="e2e" className="mb-12 scroll-mt-4">
        <CollapsibleSection title="E2E Test Example (Playwright)" badge="Playwright">
          <CodeBlock
            title="tests/planner-catalog.spec.ts (pattern)"
            language="typescript"
            code={`import { test, expect } from '@playwright/test'

test.describe('Planner Catalog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/planner')
  })

  test('loads catalog panel with products', async ({ page }) => {
    const library = page.locator('[data-testid="fabric-library-panel"]')
    await expect(library).toBeVisible()

    const products = page.locator('[data-testid="catalog-item"]')
    await expect(products.first()).toBeVisible()
    expect(await products.count()).toBeGreaterThan(0)
  })

  test('search filters products', async ({ page }) => {
    const search = page.locator('[data-testid="library-search"]')
    await search.fill('sofa')

    const products = page.locator('[data-testid="catalog-item"]')
    const count = await products.count()
    expect(count).toBeGreaterThan(0)

    // All visible items should contain "sofa" in name
    for (const item of await products.all()) {
      const name = await item.locator('[data-testid="item-name"]').textContent()
      expect(name?.toLowerCase()).toContain('sofa')
    }
  })

  test('drag product onto canvas', async ({ page }) => {
    const item = page.locator('[data-testid="catalog-item"]').first()
    const canvas = page.locator('canvas').first()

    await item.dragTo(canvas, { targetPosition: { x: 300, y: 300 } })

    // Object should appear on canvas
    await expect(page.locator('[data-testid="selected-object-info"]')).toBeVisible()
  })
})`}
          />
        </CollapsibleSection>
      </section>

      {/* Coverage */}
      <section id="coverage" className="mb-12 scroll-mt-4">
        <CollapsibleSection title="Coverage Configuration" badge="V8">
          <CodeBlock
            title="vitest.config.ts (pattern)"
            language="typescript"
            code={`import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}', 'features/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['features/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
      exclude: ['**/*.test.*', '**/*.d.ts', '**/types/**'],
      thresholds: {
        statements: 70,
        branches: 65,
        functions: 70,
        lines: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
})`}
          />
        </CollapsibleSection>
      </section>

      {/* Release gate */}
      <section className="mb-12">
        <div className="card border-amber-800/40 bg-amber-950/10">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-400 mb-1">Release Gate</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">
                The <code className="text-brand-400">release:gate</code> script is the complete pre-release pipeline. 
                It must pass before <code className="text-brand-400">vercel:prod</code> deploys to production.
              </p>
              <div className="font-mono text-xs text-gray-500 bg-gray-950/50 rounded-lg p-3 border border-gray-800">
                lint:secrets → lint → typecheck → test → build → test:a11y → test:e2e:nav → test:planner-catalog → test:coverage:planner → test:coverage:site
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
