import { supabase } from '../supabase'

export const VECTA_FLOOR_PLANS_URL = 'https://vecta.io/symbols/67/floor-plans'
const SOURCE = 'vecta-floor-plans'

const INCLUDE_TAGS = new Set([
  'furniture',
  'desk',
  'desks',
  'chair',
  'sofa',
  'table',
  'stool',
  'cupboard',
  'wardrobe',
])

const EXCLUDE_TAGS = new Set([
  'car',
  'bathroom',
  'toilet',
  'bed',
  'bedroom',
  'kitchen',
  'sink',
  'stove',
  'wall',
  'divider',
  'plant',
  'decoration',
])

const EXCLUDE_TERMS = ['car', 'toilet', 'bathroom', 'kitchen', 'sink', 'stove', 'bed']

export interface OfficeFurnitureCatalogueItem {
  id: string
  sourceSymbolId: string
  name: string
  category: string
  series: string
  tags: string[]
  symbolUrl: string
  previewSvgUrl: string | null
  stencil: string | null
}

export interface CatalogueLoadResult {
  items: OfficeFurnitureCatalogueItem[]
  source: 'live' | 'cache'
  staleReason?: string
}

function normalizeTag(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function wordsFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function toCategory(tags: string[], name: string): string {
  const text = `${tags.join(' ')} ${name}`.toLowerCase()
  if (text.includes('desk') || text.includes('segment')) return 'Desk Systems'
  if (text.includes('chair') || text.includes('sofa') || text.includes('stool')) return 'Seating'
  if (text.includes('table')) return 'Tables'
  if (text.includes('cupboard') || text.includes('wardrobe')) return 'Storage'
  return 'Furniture'
}

function toSeries(tags: string[], name: string): string {
  const text = `${tags.join(' ')} ${name}`.toLowerCase()
  if (text.includes('segment')) return 'Segment'
  if (text.includes('sofa')) return 'Sofa'
  if (text.includes('chair')) return 'Chair'
  if (text.includes('desk')) return 'Desk'
  if (text.includes('table')) return 'Table'
  if (text.includes('cupboard') || text.includes('wardrobe')) return 'Storage'
  return 'General'
}

function isOfficeFurniture(tags: string[], name: string): boolean {
  const normalizedTags = tags.map(normalizeTag)
  if (normalizedTags.some((tag) => EXCLUDE_TAGS.has(tag))) return false

  const text = `${normalizedTags.join(' ')} ${name}`.toLowerCase()
  if (EXCLUDE_TERMS.some((term) => text.includes(term))) return false

  if (normalizedTags.some((tag) => INCLUDE_TAGS.has(tag))) return true
  return text.includes('desk') || text.includes('chair') || text.includes('sofa') || text.includes('table')
}

async function fetchWithRetry(url: string): Promise<string> {
  let lastError: unknown = null
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)
    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'text/html,application/xhtml+xml' },
      })
      if (!res.ok) {
        throw new Error(`Source request failed with HTTP ${res.status}`)
      }
      const html = await res.text()
      if (html.length < 2000 || !html.includes('/symbols/67/floor-plans/')) {
        throw new Error('Source response did not contain expected floor-plan symbol markup')
      }
      return html
    } catch (error: unknown) {
      lastError = error
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 200 * attempt))
      }
    } finally {
      clearTimeout(timeout)
    }
  }
  if (lastError instanceof Error) {
    throw new Error(`Vecta catalogue fetch failed: ${lastError.message}`)
  }
  throw new Error('Vecta catalogue fetch failed with an unknown error')
}

export function parseVectaFloorPlansHtml(html: string): OfficeFurnitureCatalogueItem[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const anchors = Array.from(
    doc.querySelectorAll<HTMLAnchorElement>('a[class="Preview.cls"][href^="/symbols/67/floor-plans/"]'),
  )

  const out: OfficeFurnitureCatalogueItem[] = []
  const seen = new Set<string>()

  for (const previewAnchor of anchors) {
    const href = previewAnchor.getAttribute('href')
    if (!href) continue
    const match = href.match(/\/symbols\/67\/floor-plans\/(\d+)\/([^/?#]+)/)
    if (!match) continue
    const symbolId = match[1]
    if (seen.has(symbolId)) continue

    const slug = match[2]
    const section = previewAnchor.nextElementSibling as HTMLElement | null
    const heading = section?.querySelector('h2')?.textContent?.trim() || wordsFromSlug(slug)

    let tags: string[] = []
    let stencil: string | null = null
    const labels = Array.from(section?.querySelectorAll<HTMLElement>('div[class="Label.cls"]') ?? [])
    for (const labelNode of labels) {
      const label = labelNode.querySelector('label')?.textContent?.toLowerCase().trim()
      if (!label) continue
      if (label.includes('tags')) {
        tags = Array.from(labelNode.querySelectorAll('a'))
          .map((a) => normalizeTag(a.textContent ?? ''))
          .filter(Boolean)
      }
      if (label.includes('stencil')) {
        stencil = labelNode.querySelector('a')?.textContent?.trim() || null
      }
    }

    if (!isOfficeFurniture(tags, heading)) continue

    const previewSvgUrl =
      previewAnchor.querySelector<HTMLImageElement>('img')?.getAttribute('data-src') ?? null

    const item: OfficeFurnitureCatalogueItem = {
      id: `${SOURCE}:${symbolId}`,
      sourceSymbolId: symbolId,
      name: heading,
      category: toCategory(tags, heading),
      series: toSeries(tags, heading),
      tags,
      symbolUrl: new URL(href, VECTA_FLOOR_PLANS_URL).toString(),
      previewSvgUrl,
      stencil,
    }

    seen.add(symbolId)
    out.push(item)
  }

  return out
}

async function saveToSupabase(items: OfficeFurnitureCatalogueItem[]): Promise<void> {
  if (items.length === 0) return
  const rows = items.map((item) => ({
    source: SOURCE,
    source_symbol_id: item.sourceSymbolId,
    name: item.name,
    category: item.category,
    series: item.series,
    tags: item.tags,
    stencil: item.stencil,
    symbol_url: item.symbolUrl,
    preview_svg_url: item.previewSvgUrl,
    raw: item,
  }))

  const { error } = await supabase
    .from('catalogue_items')
    .upsert(rows, { onConflict: 'source,source_symbol_id' })
  if (error) {
    throw new Error(error.message)
  }
}

async function readFromSupabaseCache(): Promise<OfficeFurnitureCatalogueItem[]> {
  const { data, error } = await supabase
    .from('catalogue_items')
    .select(
      'source_symbol_id,name,category,series,tags,stencil,symbol_url,preview_svg_url',
    )
    .eq('source', SOURCE)
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    id: `${SOURCE}:${row.source_symbol_id}`,
    sourceSymbolId: row.source_symbol_id,
    name: row.name,
    category: row.category,
    series: row.series,
    tags: Array.isArray(row.tags) ? row.tags.map((v) => String(v)) : [],
    stencil: row.stencil,
    symbolUrl: row.symbol_url,
    previewSvgUrl: row.preview_svg_url,
  }))
}

export async function loadOfficeFurnitureCatalogue(): Promise<CatalogueLoadResult> {
  try {
    const html = await fetchWithRetry(VECTA_FLOOR_PLANS_URL)
    const items = parseVectaFloorPlansHtml(html)
    try {
      await saveToSupabase(items)
    } catch {
      // Non-fatal: availability of the editor does not depend on the cache write path.
    }
    return { items, source: 'live' }
  } catch (liveError: unknown) {
    const cached = await readFromSupabaseCache()
    if (cached.length > 0) {
      return {
        items: cached,
        source: 'cache',
        staleReason: liveError instanceof Error ? liveError.message : 'Live source unavailable',
      }
    }
    throw liveError
  }
}



