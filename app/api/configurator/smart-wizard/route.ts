import { NextResponse } from 'next/server'

import { rateLimit } from '@/lib/rateLimit'
import {
  requestProviderText,
  resolveProviderChain,
  type ServerChatMessage,
} from '@/lib/ai/providerChain'
import {
  buildFallbackWizardPlan,
  buildWizardSystemPrompt,
  clampPlacementToBounds,
  computeWizardPalette,
  findWizardCatalogItem,
  getWizardCatalog,
  parseWizardPlan,
  roomMmToCanvasUnits,
  type SmartWizardPlan,
  type SmartWizardRequest,
  type SmartWizardResponse,
} from '@/lib/configurator/smartWizard'

function parseRequest(value: unknown): SmartWizardRequest | null {
  if (!value || typeof value !== 'object') return null
  const source = value as Record<string, unknown>
  const templateId = typeof source.templateId === 'string' ? source.templateId.trim() : 'blank'
  const roomType =
    source.roomType === 'open-plan' ||
    source.roomType === 'executive' ||
    source.roomType === 'studio' ||
    source.roomType === 'coworking' ||
    source.roomType === 'blank'
      ? source.roomType
      : 'blank'
  const roomWidthMm = typeof source.roomWidthMm === 'number' ? source.roomWidthMm : NaN
  const roomLengthMm = typeof source.roomLengthMm === 'number' ? source.roomLengthMm : NaN
  const style = typeof source.style === 'string' && source.style.trim().length > 0 ? source.style.trim() : 'Modern'
  if (!templateId || !Number.isFinite(roomWidthMm) || !Number.isFinite(roomLengthMm)) return null
  return {
    templateId,
    roomType,
    roomWidthMm,
    roomLengthMm,
    style,
  }
}

function sanitizePlan(plan: SmartWizardPlan, request: SmartWizardRequest): SmartWizardResponse {
  const catalog = getWizardCatalog()
  const bounds = {
    width: roomMmToCanvasUnits(request.roomWidthMm),
    height: roomMmToCanvasUnits(request.roomLengthMm),
  }
  const warnings = [...plan.warnings]
  const placements = plan.placements
    .map((placement) => {
      const item = findWizardCatalogItem(placement.productId, catalog)
      if (!item) {
        warnings.push(`Skipped unknown product: ${placement.productId}`)
        return null
      }
      return clampPlacementToBounds(placement, item, bounds)
    })
    .filter((placement): placement is SmartWizardResponse['placements'][number] => Boolean(placement))

  return {
    summary: plan.summary,
    warnings,
    placements,
    palette: computeWizardPalette(placements, catalog),
  }
}

export async function POST(req: Request) {
  const ip =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    '127.0.0.1'

  try {
    const limitRes = await rateLimit(`configurator-smart-wizard:${ip}`, 20, 60 * 1000)
    if (!limitRes.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers: { 'X-RateLimit-Reset': limitRes.reset.toString() } },
      )
    }

    const request = parseRequest(await req.json())
    if (!request) {
      return NextResponse.json({ error: 'Invalid wizard request' }, { status: 400 })
    }

    const catalog = getWizardCatalog()
    const systemPrompt = buildWizardSystemPrompt(request, catalog)
    const messages: ServerChatMessage[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          `Template id: ${request.templateId}`,
          `Room type: ${request.roomType}`,
          `Room dimensions (mm): ${request.roomWidthMm} x ${request.roomLengthMm}`,
          `Style: ${request.style}`,
          'Generate a practical office layout with workstation clusters as single units.',
        ].join('\n'),
      },
    ]

    const providers = resolveProviderChain()
    for (const provider of providers) {
      try {
        const raw = await requestProviderText(provider, messages, {
          jsonMode: true,
          temperature: 0.35,
        })
        const parsed = parseWizardPlan(raw)
        if (!parsed) continue
        return NextResponse.json(sanitizePlan(parsed, request), { status: 200 })
      } catch (error) {
        console.error(`[configurator-smart-wizard] ${provider.provider} error:`, error)
      }
    }

    return NextResponse.json(sanitizePlan(buildFallbackWizardPlan(request, catalog), request), {
      status: 200,
    })
  } catch (error) {
    console.error('[configurator-smart-wizard] failed:', error)
    const fallbackRequest: SmartWizardRequest = {
      templateId: 'blank',
      roomType: 'blank',
      roomWidthMm: 12000,
      roomLengthMm: 8000,
      style: 'Modern',
    }
    return NextResponse.json(
      sanitizePlan(buildFallbackWizardPlan(fallbackRequest), fallbackRequest),
      { status: 200 },
    )
  }
}
