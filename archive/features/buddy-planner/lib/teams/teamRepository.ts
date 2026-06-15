// @ts-nocheck
import { db } from '@/platform/drizzle/db'
import { teams, teamMembers, invites, profiles } from '@/platform/drizzle/schema'
import { eq, and, isNull } from 'drizzle-orm'
import type { Team, TeamMember, Invite } from '../../types/team'

export async function createTeam(name: string, createdBy: string = '00000000-0000-0000-0000-000000000000'): Promise<Team> {
  // Replaced the Supabase create_team RPC with a raw Postgres transaction!
  return await db.transaction(async (tx) => {
    const [team] = await tx.insert(teams).values({ name }).returning();
    await tx.insert(teamMembers).values({
      teamId: team.id,
      userId: createdBy,
      role: 'admin'
    });
    return team as Team;
  });
}

export async function listTeamMembers(teamId: string): Promise<TeamMember[]> {
  const data = await db
    .select({
      team_id: teamMembers.teamId,
      user_id: teamMembers.userId,
      role: teamMembers.role,
      joined_at: teamMembers.joinedAt,
      email: profiles.email,
      name: profiles.name
    })
    .from(teamMembers)
    .innerJoin(profiles, eq(teamMembers.userId, profiles.id))
    .where(eq(teamMembers.teamId, teamId));

  return data.map(row => ({
    team_id: row.team_id,
    user_id: row.user_id,
    role: row.role as 'admin' | 'member',
    joined_at: row.joined_at.toISOString(),
    email: row.email,
    name: row.name ?? undefined
  }));
}

export async function listInvites(teamId: string): Promise<Invite[]> {
  const data = await db
    .select()
    .from(invites)
    .where(and(eq(invites.teamId, teamId), isNull(invites.acceptedAt)));

  return data.map(row => ({
    id: row.id,
    team_id: row.teamId,
    email: row.email,
    invited_by: row.invitedBy,
    accepted_at: row.acceptedAt?.toISOString() || null
  }));
}

export async function createInvite(teamId: string, email: string, invitedBy: string): Promise<Invite> {
  const [data] = await db
    .insert(invites)
    .values({ teamId, email, invitedBy })
    .returning();

  return {
    id: data.id,
    team_id: data.teamId,
    email: data.email,
    invited_by: data.invitedBy,
    accepted_at: data.acceptedAt?.toISOString() || null
  };
}

export async function removeMember(teamId: string, userId: string): Promise<void> {
  await db
    .delete(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
}

export async function updateMemberRole(
  teamId: string,
  userId: string,
  role: 'admin' | 'member',
): Promise<void> {
  await db
    .update(teamMembers)
    .set({ role })
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
}

export async function renameTeam(teamId: string, name: string): Promise<void> {
  await db.update(teams).set({ name }).where(eq(teams.id, teamId));
}

export async function deleteTeam(teamId: string): Promise<void> {
  await db.delete(teams).where(eq(teams.id, teamId));
}
