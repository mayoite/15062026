import { supabase } from '../supabase'

export type AssistantMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

type ThreadRow = {
  id: string
}

type MessageRow = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

type AssistantMessageRow = MessageRow & {
  role: 'user' | 'assistant'
}

export async function getLatestAssistantThreadId(officeId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('ai_threads')
    .select('id')
    .eq('office_id', officeId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return null
  return (data as ThreadRow | null)?.id ?? null
}

export async function listAssistantMessages(threadId: string): Promise<AssistantMessage[]> {
  const { data, error } = await supabase
    .from('ai_messages')
    .select('id, role, content, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
  if (error) return []

  return ((data ?? []) as MessageRow[])
    .filter((m): m is AssistantMessageRow => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      created_at: m.created_at,
    }))
}

export async function sendAssistantMessage(args: {
  officeId: string
  threadId: string | null
  message: string
  context: Record<string, unknown>
}): Promise<{ threadId: string; assistantMessage: AssistantMessage }> {
  const { data, error } = await supabase.functions.invoke('assistant-chat', {
    body: {
      officeId: args.officeId,
      threadId: args.threadId,
      message: args.message,
      context: args.context,
    },
  })

  if (error) {
    throw new Error(error.message || 'Assistant request failed')
  }

  const payload = data as {
    threadId?: string
    assistantMessage?: AssistantMessage
  } | null

  if (!payload?.threadId || !payload.assistantMessage) {
    throw new Error('Assistant response was malformed')
  }

  return {
    threadId: payload.threadId,
    assistantMessage: payload.assistantMessage,
  }
}



