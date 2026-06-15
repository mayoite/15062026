import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Loader2, PackageSearch } from 'lucide-react'
import {
  loadOfficeFurnitureCatalogue,
  type CatalogueLoadResult,
  type OfficeFurnitureCatalogueItem,
} from '../../../lib/catalogue/vectaFloorPlansRepository'

type CatalogueStatus = 'loading' | 'ready' | 'empty' | 'error'

interface CatalogueBridgeLike {
  listProducts?: () => Promise<CatalogueLoadResult | OfficeFurnitureCatalogueItem[] | unknown>
}

const UNAVAILABLE_MESSAGE =
  'Catalogue is unavailable right now. CraftBuddy editing still works normally.'

function normalizeBridgeRows(raw: unknown): OfficeFurnitureCatalogueItem[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((entry, i) => {
    if (!entry || typeof entry !== 'object') return []
    const rec = entry as Record<string, unknown>
    const sourceSymbolId =
      typeof rec.sourceSymbolId === 'string' && rec.sourceSymbolId.trim()
        ? rec.sourceSymbolId
        : `${i + 1}`
    const id = typeof rec.id === 'string' && rec.id.trim() ? rec.id : `bridge:${sourceSymbolId}`
    const name =
      typeof rec.name === 'string' && rec.name.trim() ? rec.name.trim() : 'Untitled catalogue item'
    const category =
      typeof rec.category === 'string' && rec.category.trim() ? rec.category.trim() : 'Furniture'
    const series = typeof rec.series === 'string' && rec.series.trim() ? rec.series.trim() : 'General'
    const tags = Array.isArray(rec.tags) ? rec.tags.map((v) => String(v)) : []
    const symbolUrl = typeof rec.symbolUrl === 'string' ? rec.symbolUrl : ''
    return [
      {
        id,
        sourceSymbolId,
        name,
        category,
        series,
        tags,
        symbolUrl,
        previewSvgUrl: typeof rec.previewSvgUrl === 'string' ? rec.previewSvgUrl : null,
        stencil: typeof rec.stencil === 'string' ? rec.stencil : null,
      },
    ]
  })
}

export async function loadCatalogueFromBridge(): Promise<CatalogueLoadResult> {
  const bridge = (globalThis as { __OANDO_CATALOGUE_BRIDGE__?: CatalogueBridgeLike })
    .__OANDO_CATALOGUE_BRIDGE__

  if (!bridge || typeof bridge.listProducts !== 'function') {
    return loadOfficeFurnitureCatalogue()
  }

  const raw = await bridge.listProducts()
  if (raw && typeof raw === 'object' && 'items' in raw) {
    const result = raw as CatalogueLoadResult
    if (Array.isArray(result.items)) {
      return {
        items: result.items,
        source: result.source === 'cache' ? 'cache' : 'live',
        staleReason: result.staleReason,
      }
    }
  }
  return { items: normalizeBridgeRows(raw), source: 'live' }
}

export function CatalogueBridgeShell({
  loadCatalogue = loadCatalogueFromBridge,
}: {
  loadCatalogue?: () => Promise<CatalogueLoadResult>
}) {
  const requestIdRef = useRef(0)
  const [status, setStatus] = useState<CatalogueStatus>('loading')
  const [items, setItems] = useState<OfficeFurnitureCatalogueItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'live' | 'cache'>('live')
  const [staleReason, setStaleReason] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [series, setSeries] = useState('all')

  const refresh = useCallback(() => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setStatus('loading')
    setError(null)
    setStaleReason(null)
    loadCatalogue()
      .then((next) => {
        if (requestId !== requestIdRef.current) return
        setItems(next.items)
        setSource(next.source)
        setStaleReason(next.staleReason ?? null)
        setStatus(next.items.length === 0 ? 'empty' : 'ready')
      })
      .catch((err: unknown) => {
        if (requestId !== requestIdRef.current) return
        const message = err instanceof Error && err.message ? err.message : UNAVAILABLE_MESSAGE
        setError(message)
        setItems([])
        setStatus('error')
      })
  }, [loadCatalogue])

  useEffect(() => {
// eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
    return () => {
      requestIdRef.current += 1
    }
  }, [refresh])

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(items.map((item) => item.category))).sort()],
    [items],
  )
  const seriesOptions = useMemo(
    () => ['all', ...Array.from(new Set(items.map((item) => item.series))).sort()],
    [items],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (category !== 'all' && item.category !== category) return false
      if (series !== 'all' && item.series !== series) return false
      if (!q) return true
      const haystack = `${item.name} ${item.category} ${item.series} ${item.tags.join(' ')}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [items, search, category, series])

  return (
    <div className="px-3 pb-3 pt-2">
      <div role="tablist" aria-label="Catalogue tabs" className="mb-2">
        <button
          type="button"
          role="tab"
          aria-selected={true}
          aria-controls="catalogue-bridge-panel"
          className="rounded-full border border-[color:var(--color-blueprint)]/30 bg-[color:var(--color-blueprint-soft)] px-2.5 py-1 text-[11px] font-medium text-[color:var(--color-blueprint-strong)] dark:text-[color:var(--color-blueprint)]"
        >
          Browse Catalogue
        </button>
      </div>

      <div
        id="catalogue-bridge-panel"
        role="tabpanel"
        aria-label="Browse Catalogue"
        className="rounded-md border border-[color:var(--color-paper-line)] bg-[color:var(--color-paper-raised)] p-2.5 dark:border-gray-700 dark:bg-gray-900"
      >
        <div className="mb-2 space-y-1.5">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products"
            aria-label="Search catalogue"
            className="w-full rounded border border-[color:var(--color-paper-line)] bg-[color:var(--color-paper)] px-2 py-1.5 text-ui-13 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[color:var(--color-blueprint)] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
          <div className="grid grid-cols-2 gap-1.5">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-gray-500 dark:text-gray-400">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Filter by category"
                className="rounded border border-[color:var(--color-paper-line)] bg-[color:var(--color-paper)] px-2 py-1 text-ui-13 text-gray-800 focus:outline-none focus:ring-1 focus:ring-[color:var(--color-blueprint)] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              >
                {categories.map((option) => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All categories' : option}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-gray-500 dark:text-gray-400">Series</span>
              <select
                value={series}
                onChange={(e) => setSeries(e.target.value)}
                aria-label="Filter by series"
                className="rounded border border-[color:var(--color-paper-line)] bg-[color:var(--color-paper)] px-2 py-1 text-ui-13 text-gray-800 focus:outline-none focus:ring-1 focus:ring-[color:var(--color-blueprint)] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              >
                {seriesOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All series' : option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {status === 'loading' && (
          <div className="flex items-center gap-2 text-ui-13 text-gray-600 dark:text-gray-300">
            <Loader2 size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
            <span>Loading catalogue…</span>
          </div>
        )}

        {status === 'empty' && (
          <div className="flex items-start gap-2 text-ui-13 text-gray-600 dark:text-gray-300">
            <PackageSearch size={14} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
            <p>No office furniture catalogue items are available yet.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-2">
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-red-300/70 bg-red-50/70 p-2 text-ui-13 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
            >
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={refresh}
              className="rounded-md border border-[color:var(--color-paper-line)] px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-[color:var(--color-paper-sunken)] dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Retry catalogue
            </button>
          </div>
        )}

        {status === 'ready' && (
          <div className="space-y-2">
            {source === 'cache' ? (
              <p className="rounded border border-amber-300/70 bg-amber-50/70 px-2 py-1 text-[11px] text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                Showing cached catalogue data. {staleReason ? `Live fetch failed: ${staleReason}` : ''}
              </p>
            ) : null}

            {filtered.length === 0 ? (
              <p className="text-ui-13 text-gray-600 dark:text-gray-300">No products match the current filters.</p>
            ) : (
              <ul className="space-y-1">
                {filtered.slice(0, 50).map((item) => (
                  <li
                    key={item.id}
                    className="rounded border border-[color:var(--color-paper-line)] px-2 py-1.5 dark:border-gray-700"
                  >
                    <p className="text-ui-13 font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {item.category} · {item.series}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}



