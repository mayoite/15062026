import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'

const STORAGE_KEY = 'firstRunWelcomeSeen'

function readInitialSeen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // Private mode / quota — the card still unmounts via component state.
  }
}

interface CoachStep {
  id: string
  title: string
  body: React.ReactNode
}

/**
 * First-run coach composite.
 * 
 * FirstRunCoachTour — a step-by-step popover teaching the editor's
 * main moves (pan, tools, command palette, shortcut sheet, MAP
 * tab). Persists "seen" via localStorage under `firstRunWelcomeSeen`.
 */
export function FirstRunCoach() {
  return (
    <>
      <FirstRunCoachTour />
    </>
  )
}

/**
 * Step-by-step first-run tour. Walks new editors through the editor's
 * main moves (pan, tools, command palette, shortcut sheet, MAP
 * tab) in a compact step-by-step popover. Persists "seen" via
 * localStorage under `firstRunWelcomeSeen` so it never re-pops once
 * dismissed; an Escape dismiss is ALSO honored as a session-level
 * suppression so a remount inside the same tab can't bring it back even
 * before the storage write lands.
 */
function FirstRunCoachTour() {
  const [dismissed, setDismissed] = useState<boolean>(() => readInitialSeen())
  const [stepIdx, setStepIdx] = useState(0)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const primaryBtnRef = useRef<HTMLButtonElement | null>(null)

  const steps: CoachStep[] = useMemo(
    () => [
      {
        id: 'fr-step-pan',
        title: 'Move around the canvas',
        body: (
          <>
            Drag the empty canvas to <strong>pan</strong>, scroll to{' '}
            <strong>zoom</strong>. Hold <kbd>Space</kbd> for the classic
            pan-tool feel — release to snap back to your previous tool.
          </>
        ),
      },
      {
        id: 'fr-step-tools',
        title: 'Pick a tool',
        body: (
          <>
            Tools live in the left sidebar — or press a hotkey:{' '}
            <kbd>V</kbd> select, <kbd>W</kbd> wall, <kbd>R</kbd> rectangle,{' '}
            <kbd>E</kbd> ellipse, <kbd>T</kbd> text.
          </>
        ),
      },
      {
        id: 'fr-step-palette',
        title: 'Command palette',
        body: (
          <>
            Press <kbd>Cmd</kbd>+<kbd>K</kbd> to open the command palette —
            every action in one searchable list. <kbd>Cmd</kbd>+<kbd>F</kbd>{' '}
            opens the canvas finder to highlight elements by label.
          </>
        ),
      },
      {
        id: 'fr-step-shortcuts',
        title: 'See every shortcut',
        body: (
          <>
            Press <kbd>?</kbd> at any time to pop the full shortcut cheat
            sheet. <kbd>P</kbd> toggles presentation mode.
          </>
        ),
      },
      {
        id: 'fr-step-tabs',
        title: 'Switch views',
        body: (
          <>
            <strong>MAP</strong> tab sits at the top of every office. Press{' '}
            <kbd>M</kbd> for the map — your selection survives the jump.
          </>
        ),
      },
    ],
    [],
  )

  const totalSteps = steps.length
  const isLastStep = stepIdx >= totalSteps - 1
  const activeStep = steps[stepIdx] ?? steps[0]

  const handleDismiss = useCallback(() => {
    writeSeen()
    setDismissed(true)
  }, [])

  const handleNext = useCallback(() => {
    if (isLastStep) {
      handleDismiss()
      return
    }
    setStepIdx((i) => Math.min(totalSteps - 1, i + 1))
  }, [isLastStep, totalSteps, handleDismiss])

  const handleBack = useCallback(() => {
    setStepIdx((i) => Math.max(0, i - 1))
  }, [])

  useEffect(() => {
    if (dismissed) return
    const id = window.setTimeout(() => primaryBtnRef.current?.focus(), 0)
    return () => window.clearTimeout(id)
  }, [dismissed, stepIdx])

  useEffect(() => {
    if (dismissed) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopImmediatePropagation()
        handleDismiss()
        return
      }
      if (e.key !== 'Tab') return
      const card = cardRef.current
      if (!card) return
      const focusables = card.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])',
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handler, { capture: true })
    return () => {
      window.removeEventListener('keydown', handler, { capture: true } as EventListenerOptions)
    }
  }, [dismissed, handleDismiss])

  if (dismissed) return null

  const handleOpenPalette = () => {
    useUIStore.getState().setCommandPaletteOpen(true)
    handleDismiss()
  }

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="first-run-coach-title"
      className="absolute bottom-12 right-4 w-[360px] bg-[color:var(--color-paper-raised)] dark:bg-gray-900 shadow-soft rounded-md border border-[color:var(--color-paper-line)] dark:border-gray-800 p-5 z-40"
    >
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="bg-[color:var(--color-blueprint-soft)] text-[color:var(--color-blueprint-strong)] dark:text-[color:var(--color-blueprint)] rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0"
        >
          <Sparkles size={20} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div
            id="first-run-coach-title"
            className="font-semibold text-gray-900 dark:text-gray-100"
          >
            Welcome to Buddycraft
          </div>
          <div className="text-ui-13 text-gray-600 dark:text-gray-300 mt-0.5">
            A quick tour of the editor — {totalSteps} steps.
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 -mr-1 -mt-1 p-1 rounded"
          aria-label="Dismiss welcome card"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4">
        <h3
          id={activeStep.id}
          className="text-ui-13 font-semibold text-gray-900 dark:text-gray-100"
        >
          {activeStep.title}
        </h3>
        <p className="mt-1.5 text-ui-13 text-gray-700 dark:text-gray-200 leading-relaxed">
          {activeStep.body}
        </p>
      </div>

      <div
        className="mt-5 flex items-center gap-1.5"
        aria-label={`Step ${stepIdx + 1} of ${totalSteps}`}
      >
        {steps.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStepIdx(i)}
            aria-label={`Go to step ${i + 1}: ${s.title}`}
            aria-current={i === stepIdx ? 'step' : undefined}
            className={`h-1.5 rounded-full transition-all ${
              i === stepIdx
                ? 'w-5 bg-[color:var(--color-blueprint)] dark:bg-[color:var(--color-blueprint)]'
                : i < stepIdx
                  ? 'w-1.5 bg-[color:var(--color-blueprint-line)] dark:bg-[color:var(--color-blueprint)]'
                  : 'w-1.5 bg-gray-300 dark:bg-gray-700'
            }`}
          />
        ))}
        <span className="ml-auto text-ui-11 text-gray-500 dark:text-gray-400 tabular-nums">
          {stepIdx + 1} / {totalSteps}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleDismiss}
          className="text-ui-13 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          Skip tour
        </button>
        <div className="ml-auto flex items-center gap-2">
          {stepIdx > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="px-3 py-1.5 text-ui-13 font-medium rounded-md border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-[color:var(--color-paper-sunken)] dark:hover:bg-gray-800/50"
            >
              Back
            </button>
          )}
          {isLastStep ? (
            <>
              <button
                type="button"
                onClick={handleOpenPalette}
                className="px-3 py-1.5 text-ui-13 font-medium rounded-md border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-[color:var(--color-paper-sunken)] dark:hover:bg-gray-800/50"
              >
                Open palette
              </button>
              <button
                ref={primaryBtnRef}
                type="button"
                onClick={handleDismiss}
                className="px-3 py-1.5 text-ui-13 font-medium rounded-md bg-[color:var(--color-blueprint)] hover:bg-[color:var(--color-blueprint-strong)] text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-blueprint)]/40"
              >
                Done
              </button>
            </>
          ) : (
            <button
              ref={primaryBtnRef}
              type="button"
              onClick={handleNext}
              className="px-3 py-1.5 text-ui-13 font-medium rounded-md bg-[color:var(--color-blueprint)] hover:bg-[color:var(--color-blueprint-strong)] text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-blueprint)]/40"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
