import type { FormEvent} from 'react';
import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Loader2, Sparkles } from 'lucide-react'
import { useProjectStore } from '../../stores/projectStore'
import { useUIStore } from '../../stores/uiStore'
import { useElementsStore } from '../../stores/elementsStore'
import { useFloorStore } from '../../stores/floorStore'
import { useCan } from '../../hooks/useCan'
import { Button, Modal, ModalBody } from '../ui'
import {
  getLatestAssistantThreadId,
  listAssistantMessages,
  sendAssistantMessage,
  type AssistantMessage,
} from '../../lib/assistant/assistantRepository'

type ChatMessage = AssistantMessage

function buildOfficeContext() {
  const floors = useFloorStore.getState().floors
  const activeFloorId = useFloorStore.getState().activeFloorId
  const elements = Object.values(useElementsStore.getState().elements as Record<string, unknown>)


  return {
    floors: floors.length,
    activeFloorId: activeFloorId || null,
    elements: elements.length,
  }
}

export function BuddyCraftAssistant() {
  const open = useUIStore((s) => s.assistantOpen)
  const setOpen = useUIStore((s) => s.setAssistantOpen)
  const officeId = useProjectStore((s) => s.officeId)
  const officeName = useProjectStore((s) => s.currentProject?.name ?? 'Office')
  const canEditMap = useCan('editMap')
  const canUseAssistant = canEditMap

  const [threadId, setThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [bootLoading, setBootLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open || !officeId) return
    let cancelled = false
 
// eslint-disable-next-line react-hooks/set-state-in-effect
    setBootLoading(true)
    setError(null)
    ;(async () => {
      const latest = await getLatestAssistantThreadId(officeId)
      if (cancelled) return
      setThreadId(latest)
      if (!latest) {
        setMessages([])
        setBootLoading(false)
        return
      }
      const history = await listAssistantMessages(latest)
      if (cancelled) return
      setMessages(history)
      setBootLoading(false)
    })().catch(() => {
      if (!cancelled) {
        setError('Failed to load assistant history.')
        setBootLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [open, officeId])

  useEffect(() => {
    const node = listRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [messages, bootLoading, loading])

  const placeholder = useMemo(
    () => `Ask Buddy Craft AI about ${officeName}...`,
    [officeName],
  )

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!officeId || !canUseAssistant || loading) return
    const trimmed = prompt.trim()
    if (!trimmed) return

    setPrompt('')
    setError(null)

    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    setLoading(true)
    try {
      const response = await sendAssistantMessage({
        officeId,
        threadId,
        message: trimmed,
        context: buildOfficeContext(),
      })
      setThreadId(response.threadId)
      setMessages((prev) => [...prev, response.assistantMessage])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Assistant request failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Buddy Craft AI" size="lg">
      <ModalBody className="space-y-3">
        {!canUseAssistant && (
          <div
            role="alert"
            className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-ui-13 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
          >
            Your current role is view-only. Ask an editor or owner to use Buddy Craft AI.
          </div>
        )}
        <div
          ref={listRef}
          className="h-[360px] overflow-y-auto rounded-md border border-[color:var(--color-paper-line)] dark:border-gray-800 bg-[color:var(--color-paper-sunken)] dark:bg-gray-950 p-3 space-y-3"
          aria-live="polite"
        >
          {bootLoading && (
            <div className="text-ui-13 text-gray-500 dark:text-gray-400">Loading conversation...</div>
          )}
          {!bootLoading && messages.length === 0 && (
            <div className="text-ui-13 text-gray-500 dark:text-gray-400">
              Ask for layout suggestions, seating strategy, or circulation improvements.
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[90%] rounded-md px-3 py-2 text-ui-13 whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'ml-auto bg-[color:var(--color-blueprint)] text-white'
                  : 'mr-auto bg-[color:var(--color-paper-raised)] dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-[color:var(--color-paper-line)] dark:border-gray-800'
              }`}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="mr-auto inline-flex items-center gap-2 rounded-md border border-[color:var(--color-paper-line)] dark:border-gray-800 bg-[color:var(--color-paper-raised)] dark:bg-gray-900 px-3 py-2 text-ui-13 text-gray-700 dark:text-gray-200">
              <Loader2 size={14} className="animate-spin" />
              Thinking...
            </div>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="rounded border border-red-200 bg-red-50 px-3 py-2 text-ui-13 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-2">
          <label htmlFor="buddycraft-ai-prompt" className="sr-only">
            Ask Buddy Craft AI
          </label>
          <textarea
            id="buddycraft-ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholder}
            disabled={!canUseAssistant || loading}
            rows={3}
            className="w-full resize-y rounded border border-[color:var(--color-paper-line)] bg-[color:var(--color-paper-raised)] px-3 py-2 text-ui-13 text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-blueprint)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1 text-ui-11 text-gray-500 dark:text-gray-400">
              <Bot size={13} />
              Context-aware suggestions for {officeName}
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={!canUseAssistant || loading || !prompt.trim()}
              leftIcon={loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            >
              {loading ? 'Sending...' : 'Ask Buddy Craft AI'}
            </Button>
          </div>
        </form>
      </ModalBody>
    </Modal>
  )
}



