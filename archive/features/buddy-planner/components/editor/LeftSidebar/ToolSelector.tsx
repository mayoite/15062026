import { useEffect, useState } from 'react'
import { useCanvasStore, type ToolType, type WallDrawStyle } from '../../../stores/canvasStore'

import { useFirstUseTooltip } from '../../../hooks/useFirstUseTooltip'
import { FirstUseTooltip } from '../FirstUseTooltip'
import { useCan } from '../../../hooks/useCan'
import {
  MousePointer2,
  Hand,
  Minus,
  LayoutTemplate,
  DoorOpen,
  SquareIcon,
  Square,
  Circle,
  Slash,
  ArrowRight,
  Type,
  Ruler,
  MapPin,
  Scaling,
} from 'lucide-react'

interface ToolDef {
  id: ToolType
  label: string
  icon: React.ReactNode
  shortcut: string
  /** One-line first-use description shown in the rich hover tooltip. */
  description: string
}

const tools: ToolDef[] = [
  {
    id: 'select',
    label: 'Select',
    icon: <MousePointer2 size={18} aria-hidden="true" />,
    shortcut: 'V',
    description: 'Click an element to select, drag empty canvas to pan, Shift+drag to lasso.',
  },
  {
    id: 'pan',
    label: 'Pan',
    icon: <Hand size={18} aria-hidden="true" />,
    shortcut: 'Space',
    description: 'Dedicated pan mode. Hold Space anywhere for a temporary pan instead.',
  },
  {
    id: 'wall',
    label: 'Wall',
    icon: <Minus size={18} aria-hidden="true" />,
    shortcut: 'W',
    description: 'Click and drag to draw a straight wall. Double-click to finish and drop back to pan.',
  },
  {
    id: 'room',
    label: 'Room',
    icon: <LayoutTemplate size={18} aria-hidden="true" />,
    shortcut: '⇧W',
    description: 'Click and drag to draw a rectangular room made of real connected walls.',
  },
  {
    id: 'door',
    label: 'Door',
    icon: <DoorOpen size={18} aria-hidden="true" />,
    shortcut: '⇧D',
    description: 'Click a wall to drop in a door at that position.',
  },
  {
    id: 'window',
    label: 'Window',
    icon: <SquareIcon size={18} aria-hidden="true" />,
    shortcut: '⇧N',
    description: 'Click a wall to place a window along its length.',
  },
  // Drawing primitives. Shortcut picks:
  //   R = rect, E = ellipse (C is already taken visually by "Circle" but we
  //   avoid the D/G/M/R conflicts in useKeyboardShortcuts), L = line,
  //   A = arrow, T = text. D is "toggle dimensions" and G is "toggle grid",
  //   so we avoid those.
  {
    id: 'rect-shape',
    label: 'Rectangle',
    icon: <Square size={18} aria-hidden="true" />,
    shortcut: '⇧R',
    description: 'Click and drag to draw a rectangle. Useful for rough space blocks.',
  },
  {
    id: 'ellipse',
    label: 'Ellipse',
    icon: <Circle size={18} aria-hidden="true" />,
    shortcut: 'E',
    description: 'Click and drag to draw an ellipse. Hold Shift for a perfect circle.',
  },
  {
    id: 'line-shape',
    label: 'Line',
    icon: <Slash size={18} aria-hidden="true" />,
    shortcut: 'L',
    description: 'Click and drag to draw a straight line for annotations.',
  },
  {
    id: 'arrow',
    label: 'Arrow',
    icon: <ArrowRight size={18} aria-hidden="true" />,
    shortcut: 'A',
    description: 'Click and drag to draw an arrow. Great for call-outs and flow.',
  },
  {
    id: 'free-text',
    label: 'Text',
    icon: <Type size={18} aria-hidden="true" />,
    shortcut: 'T',
    description: 'Click anywhere to drop a text label on the canvas.',
  },
  // Measure is a read-only tool — architects and facilities managers use
  // it often to check corridor widths and room sizes, so we expose it
  // alongside the primitives. Shift+M because plain M jumps to Map view.
  {
    id: 'measure',
    label: 'Measure',
    icon: <Ruler size={18} aria-hidden="true" />,
    shortcut: '⇧M',
    description: 'Click points to measure distance. Double-click or Enter to finish.',
  },
  {
    id: 'calibrate-scale',
    label: 'Set Scale',
    icon: <Scaling size={18} aria-hidden="true" />,
    shortcut: 'K',
    description: 'Click two known points, enter the real dimension, and calibrate the drawing scale.',
  },
  // Neighborhoods: drag-create a labeled zone that tints a seat region.
  // Plain G is "toggle grid", so the tool is shift-locked to ⇧G.
  {
    id: 'neighborhood',
    label: 'Neighborhood',
    icon: <MapPin size={18} aria-hidden="true" />,
    shortcut: '⇧G',
    description: 'Drag on empty canvas to paint a labeled zone for a team or group.',
  },
]

const WALL_STYLES: { id: WallDrawStyle; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'dashed', label: 'Dashed' },
  { id: 'dotted', label: 'Dotted' },
]

const READ_ONLY_TOOL_IDS = new Set<ToolType>(['select', 'pan', 'measure'])

export function ToolSelector() {
  const activeTool = useCanvasStore((s) => s.activeTool)
  const setActiveTool = useCanvasStore((s) => s.setActiveTool)
  const wallDrawStyle = useCanvasStore((s) => s.wallDrawStyle)
  const setWallDrawStyle = useCanvasStore((s) => s.setWallDrawStyle)
  const canEditMap = useCan('editMap')

  const { showRichTooltip, markToolUsed } = useFirstUseTooltip()

  // Hovered tool id; only one rich tooltip is visible at a time to avoid
  // a stack of cards when the user sweeps the cursor down the rail.
  const [hoveredToolId, setHoveredToolId] = useState<ToolType | null>(null)

  const visibleTools = canEditMap
    ? tools
    : tools.filter((tool) => READ_ONLY_TOOL_IDS.has(tool.id))

  useEffect(() => {
    if (canEditMap || READ_ONLY_TOOL_IDS.has(activeTool)) return
    setActiveTool('select')
  }, [activeTool, canEditMap, setActiveTool])

  const handleToolClick = (tool: ToolDef) => {
    setActiveTool(tool.id)
    markToolUsed(tool.id)
  }

  return (
    <div className="p-2">
      <div className="flex flex-col gap-0.5">
        {visibleTools.map((tool) => {
          const isRich = hoveredToolId === tool.id && showRichTooltip(tool.id)
          const tooltipId = `first-use-tooltip-${tool.id}`
          return (
            <div key={tool.id} className="relative">
              <button
                onClick={() => handleToolClick(tool)}
                onMouseEnter={() => setHoveredToolId(tool.id)}
                onMouseLeave={() =>
                  setHoveredToolId((prev) => (prev === tool.id ? null : prev))
                }
                onFocus={() => setHoveredToolId(tool.id)}
                onBlur={() =>
                  setHoveredToolId((prev) => (prev === tool.id ? null : prev))
                }
                className={`flex h-9 w-9 mx-auto items-center justify-center rounded-xl border transition-colors ${
                  activeTool === tool.id
                    ? 'border-[var(--surface-panel)] bg-gradient-to-r from-[var(--surface-panel)] to-white text-[color:var(--color-primary)] dark:border-[var(--border-soft)] dark:bg-gradient-to-r dark:from-[var(--border-soft)] dark:to-[var(--text-body)] dark:text-[var(--border-soft)] font-medium shadow-sm'
                    : 'border-transparent text-gray-700 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-900/60 hover:border-gray-200 dark:hover:border-gray-800'
                }`}
                title={
                  isRich
                    ? undefined
                    : tool.shortcut
                      ? `${tool.label} (${tool.shortcut})`
                      : tool.label
                }
                aria-label={tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label}
                aria-describedby={isRich ? tooltipId : undefined}
              >
                {tool.icon}
              </button>
              {isRich && (
                <FirstUseTooltip
                  id={tooltipId}
                  name={tool.label}
                  description={tool.description}
                  shortcut={tool.shortcut}
                  icon={tool.icon}
                />
              )}
              {/* Wall-style presets. Only visible with the wall tool active so
                  the sidebar doesn't get noisy with options for inactive tools. */}
              {tool.id === 'wall' && activeTool === 'wall' && (
                <div
                  role="radiogroup"
                  aria-label="Wall line style"
                  className="flex flex-col gap-1 px-1 pb-1 pt-0.5"
                >
                  {WALL_STYLES.map((s) => (
                    <button
                      key={s.id}
                      role="radio"
                      aria-checked={wallDrawStyle === s.id}
                      onClick={() => setWallDrawStyle(s.id)}
                      title={`${s.label} wall`}
                      className={`w-full px-1 py-0.5 text-[10px] rounded-full border transition-colors ${
                        wallDrawStyle === s.id
                          ? 'bg-[color:var(--color-primary)] text-white border-[color:var(--color-primary)]'
                          : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:border-[color:var(--color-bronze-400)]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
