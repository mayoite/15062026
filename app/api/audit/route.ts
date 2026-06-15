import { NextResponse } from 'next/server'
import { insertEvent } from '@/lib/audit/auditRepository'
import { rateLimit } from "@/lib/rateLimit"
import { createServerClient } from "@/lib/supabase/server"

function getRequestIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return req.headers.get("cf-connecting-ip") || "127.0.0.1"
}

export async function POST(req: Request) {
  try {
    const ip = getRequestIp(req)
    const limitRes = await rateLimit(`audit:${ip}`, 30, 60 * 1000)
    if (!limitRes.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'X-RateLimit-Reset': limitRes.reset.toString() } }
      )
    }

    const supabase = await createServerClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    const userId = authData.user?.id?.trim() || ""
    if (authError || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { team_id, action, target_type, target_id, metadata } = body

    if (
      typeof team_id !== "string" ||
      typeof action !== "string" ||
      typeof target_type !== "string"
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const normalizedTeamId = team_id.trim().slice(0, 120)
    if (!normalizedTeamId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await insertEvent({
      team_id: normalizedTeamId,
      actor_id: userId.slice(0, 120),
      action: action.trim().slice(0, 120),
      target_type: target_type.trim().slice(0, 120),
      target_id: typeof target_id === "string" ? target_id.trim().slice(0, 120) : null,
      metadata: metadata && typeof metadata === "object" ? metadata : {}
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[POST /api/audit] error:', error)
    return NextResponse.json({ error: 'Failed to record audit event' }, { status: 500 })
  }
}
