"use client";

import { useMemo, useState } from 'react'
import { Loader2, Sparkles, Wand2, SquarePen } from 'lucide-react'

import { Button, Modal, ModalBody, ModalFooter } from '../ui'
import { Input } from '../ui/Input'
import { useUIStore } from '../../stores/uiStore'
import { useGuestAccessStore } from '../../stores/guestAccessStore'
import { useElementsStore } from '../../stores/elementsStore'
import { useCanvasStore } from '../../stores/canvasStore'
import { useProjectStore } from '../../stores/projectStore'
import { TEMPLATES } from '../../data/templates'
import { buildLibraryElement } from './LeftSidebar/ElementLibrary'
import type { CanvasElement } from '../../types/elements'
import {
  findWizardCatalogItem,
  getWizardCatalog,
  SMART_WIZARD_ROOM_TYPES,
  SMART_WIZARD_STYLE_PRESETS,
  type SmartWizardPlan,
  type SmartWizardRequest,
  type SmartWizardResponse,
  type SmartWizardRoomType,
  type SmartWizardStylePreset,
} from '../../lib/smartWizard'

type WizardTemplateId = (typeof TEMPLATES)[number]['id']

const DEFAULT_TEMPLATE_ID: WizardTemplateId = 'blank'
const DEFAULT_ROOM_WIDTH_MM = 12000
const DEFAULT_ROOM_LENGTH_MM = 8000

function buildRequest({
  templateId,
  roomType,
  roomWidthMm,
  roomLengthMm,
  style,
}: {
  templateId: WizardTemplateId
  roomType: SmartWizardRoomType
  roomWidthMm: number
  roomLengthMm: number
  style: SmartWizardStylePreset | string
}): SmartWizardRequest {
  return {
    templateId,
    roomType,
    roomWidthMm,
    roomLengthMm,
    style,
  }
}

export function SmartWizardModal() {
  const open = useUIStore((s) => s.smartWizardOpen)
  const setOpen = useUIStore((s) => s.setSmartWizardOpen)
  const guestMode = useGuestAccessStore((s) => s.enabled)
  const setElements = useElementsStore((s) => s.setElements)
  const setActiveTool = useCanvasStore((s) => s.setActiveTool)
  const setSettings = useCanvasStore((s) => s.setSettings)
  const clearSelection = useUIStore((s) => s.clearSelection)
  const projectName = useProjectStore((s) => s.currentProject?.name ?? 'Untitled project')

  const [templateId, setTemplateId] = useState<WizardTemplateId>(DEFAULT_TEMPLATE_ID)
  const [roomType, setRoomType] = useState<SmartWizardRoomType>('open-plan')
  const [style, setStyle] = useState<SmartWizardStylePreset>('Modern')
  const [roomWidthMm, setRoomWidthMm] = useState(DEFAULT_ROOM_WIDTH_MM)
  const [roomLengthMm, setRoomLengthMm] = useState(DEFAULT_ROOM_LENGTH_MM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<SmartWizardResponse | null>(null)
  const [applied, setApplied] = useState(false)

  const request = useMemo(
    () =>
      buildRequest({
        templateId,
        roomType,
        roomWidthMm,
        roomLengthMm,
        style,
      }),
    [templateId, roomType, roomWidthMm, roomLengthMm, style],
  )

  const catalog = getWizardCatalog()

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setApplied(false)
    try {
      const response = await fetch('/api/buddy/smart-wizard', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request),
      })
      const payload = (await response.json()) as unknown
      if (!response.ok || !payload || typeof payload !== 'object' || !('placements' in payload)) {
        const candidate = payload && typeof payload === 'object' ? (payload as { error?: unknown }) : null
        const message =
          typeof candidate?.error === 'string' ? candidate.error : 'Wizard generation failed'
        throw new Error(message)
      }
      setPlan(payload as SmartWizardResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wizard generation failed')
    } finally {
      setLoading(false)
    }
  }

  function applyPlan(nextPlan: SmartWizardPlan) {
    const template = TEMPLATES.find((item) => item.id === templateId) ?? TEMPLATES[0]
    const baseElements = templateId === 'blank' ? [] : template.createElements()
    const elementMap: Record<string, CanvasElement> = {}
    let zIndex = 0

    for (const element of baseElements) {
      elementMap[element.id] = element as CanvasElement
      zIndex = Math.max(zIndex, element.zIndex)
    }

    for (const placement of nextPlan.placements) {
      const item = findWizardCatalogItem(placement.productId, catalog)
      if (!item) continue
      const element = buildLibraryElement(
        item,
        placement.x,
        placement.y,
        ++zIndex,
        elementMap,
      ) as CanvasElement
      element.rotation = placement.rotation
      elementMap[element.id] = element
    }

    setElements(elementMap)
    setSettings(template.canvasSettings)
    setActiveTool('select')
    clearSelection()
    setApplied(true)
  }

  const close = () => {
    setOpen(false)
    setError(null)
    setPlan(null)
    setLoading(false)
    setApplied(false)
  }

  return (
    <Modal open={open} onClose={close} title="AI Smart Wizard" size="lg">
      <ModalBody className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 text-ui-13">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
              Start from template
            </span>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value as WizardTemplateId)}
              className="w-full rounded-md border border-[color:var(--color-paper-line)] bg-[color:var(--color-paper-raised)] px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              {TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-ui-13">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
              Room type
            </span>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value as SmartWizardRoomType)}
              className="w-full rounded-md border border-[color:var(--color-paper-line)] bg-[color:var(--color-paper-raised)] px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              {SMART_WIZARD_ROOM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace('-', ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-ui-13">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
              Style
            </span>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as SmartWizardStylePreset)}
              className="w-full rounded-md border border-[color:var(--color-paper-line)] bg-[color:var(--color-paper-raised)] px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              {SMART_WIZARD_STYLE_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-ui-13">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
              Room width mm
            </span>
            <Input
              type="number"
              min={1000}
              step={100}
              value={roomWidthMm}
              onChange={(e) => setRoomWidthMm(Number(e.target.value) || DEFAULT_ROOM_WIDTH_MM)}
            />
          </label>
          <label className="space-y-1.5 text-ui-13">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
              Room length mm
            </span>
            <Input
              type="number"
              min={1000}
              step={100}
              value={roomLengthMm}
              onChange={(e) => setRoomLengthMm(Number(e.target.value) || DEFAULT_ROOM_LENGTH_MM)}
            />
          </label>
          <div className="space-y-1.5 rounded-md border border-dashed border-[color:var(--color-paper-line)] bg-[color:var(--color-paper-sunken)] p-3 text-ui-13 dark:border-gray-800 dark:bg-gray-950/60 md:col-span-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
              Project
            </div>
            <div className="text-gray-700 dark:text-gray-200">{projectName}</div>
            <div className="text-ui-11 text-gray-500 dark:text-gray-400">
              The wizard will replace the current canvas with the selected template and generated layout.
            </div>
          </div>
        </div>

        {guestMode && (
          <div
            role="alert"
            className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-ui-13 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
          >
            Guest mode is suggest-only. You can generate a plan, but it will not be applied to the canvas.
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-ui-13 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}
          </div>
        )}

        {plan && (
          <div className="space-y-3 rounded-md border border-[color:var(--color-paper-line)] bg-[color:var(--color-paper-sunken)] p-3 dark:border-gray-800 dark:bg-gray-950/60">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                  <Sparkles size={12} />
                  Generated layout
                </div>
                <p className="mt-1 text-ui-13 text-gray-800 dark:text-gray-100">{plan.summary}</p>
              </div>
              {applied && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Applied
                </span>
              )}
            </div>

            {plan.warnings.length > 0 && (
              <ul className="space-y-1 text-ui-11 text-amber-700 dark:text-amber-300">
                {plan.warnings.map((warning) => (
                  <li key={warning} className="flex gap-2">
                    <span>•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap gap-2">
              {plan.palette.map((color) => (
                <span
                  key={color}
                  className="inline-flex items-center gap-1 rounded-full border border-[color:var(--color-paper-line)] bg-[color:var(--color-paper-raised)] px-2 py-1 text-[11px] text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                >
                  <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                  {color}
                </span>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {plan.placements.map((placement, index) => {
                const item = findWizardCatalogItem(placement.productId, catalog)
                return (
                  <div
                    key={`${placement.productId}-${index}`}
                    className="rounded-md border border-[color:var(--color-paper-line)] bg-[color:var(--color-paper-raised)] px-3 py-2 text-ui-13 dark:border-gray-700 dark:bg-gray-900"
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {item?.label ?? placement.productId}
                    </div>
                    <div className="text-ui-11 text-gray-500 dark:text-gray-400">
                      {placement.x}, {placement.y} · {placement.rotation}°
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={close}>
          Close
        </Button>
        <Button
          variant="primary"
          leftIcon={loading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate layout'}
        </Button>
        {!guestMode && plan && (
          <Button
            variant="primary"
            leftIcon={<SquarePen size={14} />}
            onClick={() => applyPlan(plan)}
          >
            Apply to canvas
          </Button>
        )}
      </ModalFooter>
    </Modal>
  )
}
