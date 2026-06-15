import { db } from '@/platform/drizzle/db'
import { auditEvents } from '@/platform/drizzle/schema'
import { eq, gte, lte, desc, and } from 'drizzle-orm'

export interface AuditEventRow {
  id?: string
  team_id: string
  actor_id: string
  action: string
  target_type: string | null
  target_id: string | null
  metadata: Record<string, unknown>
  created_at?: string
}

export async function insertEvent(row: AuditEventRow): Promise<void> {
  await db.insert(auditEvents).values({
    teamId: row.team_id,
    actorId: row.actor_id,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    metadata: row.metadata,
  });
}

export interface ListOptions {
  actorId?: string
  action?: string
  from?: string
  to?: string
  limit?: number
}

export async function listEvents(
  teamId: string,
  opts: ListOptions = {},
): Promise<AuditEventRow[]> {
  const conditions = [eq(auditEvents.teamId, teamId)];
  if (opts.actorId) conditions.push(eq(auditEvents.actorId, opts.actorId));
  if (opts.action) conditions.push(eq(auditEvents.action, opts.action));
  if (opts.from) conditions.push(gte(auditEvents.createdAt, new Date(opts.from)));
  if (opts.to) conditions.push(lte(auditEvents.createdAt, new Date(opts.to)));

  const data = await db
    .select()
    .from(auditEvents)
    .where(and(...conditions))
    .orderBy(desc(auditEvents.createdAt))
    .limit(opts.limit ?? 200);

  return data.map(row => ({
    id: row.id,
    team_id: row.teamId,
    actor_id: row.actorId,
    action: row.action,
    target_type: row.targetType,
    target_id: row.targetId,
    metadata: row.metadata as Record<string, unknown>,
    created_at: row.createdAt.toISOString()
  }));
}
