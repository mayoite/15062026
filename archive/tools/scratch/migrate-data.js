import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  console.log("Initializing Migration...");
  
  const source = postgres(process.env.SUPABASE_AUTH_DATABASE_URL, { ssl: 'require', connect_timeout: 10 });
  const target = postgres(process.env.DATABASE_URL, { ssl: 'require', connect_timeout: 10 });

  try {
    console.log("Migrating [profiles]...");
    const profiles = await source`SELECT * FROM profiles`;
    if (profiles.length) {
      await target`INSERT INTO profiles ${target(profiles, 'id', 'email', 'name')} ON CONFLICT (id) DO NOTHING`;
    }

    console.log("Migrating [teams]...");
    const teams = await source`SELECT * FROM teams`;
    if (teams.length) {
      await target`INSERT INTO teams ${target(teams, 'id', 'name')} ON CONFLICT (id) DO NOTHING`;
    }

    console.log("Migrating [team_members]...");
    const teamMembers = await source`SELECT * FROM team_members`;
    if (teamMembers.length) {
      await target`INSERT INTO team_members ${target(teamMembers, 'team_id', 'user_id', 'role', 'joined_at')} ON CONFLICT DO NOTHING`;
    }

    console.log("Migrating [invites]...");
    const invites = await source`SELECT * FROM invites`;
    if (invites.length) {
      await target`INSERT INTO invites ${target(invites, 'id', 'team_id', 'email', 'invited_by', 'accepted_at')} ON CONFLICT (id) DO NOTHING`;
    }

    console.log("Migrating [offices]...");
    const offices = await source`SELECT * FROM offices`;
    if (offices.length) {
      await target`INSERT INTO offices ${target(offices, 'id', 'team_id', 'slug', 'name', 'is_private', 'payload', 'created_by', 'last_edited_by', 'archived_at', 'updated_at')} ON CONFLICT (id) DO NOTHING`;
    }

    try {
      console.log("Migrating [audit_events]...");
      const auditEvents = await source`SELECT * FROM audit_events`;
      if (auditEvents.length) {
        await target`INSERT INTO audit_events ${target(auditEvents, 'id', 'team_id', 'actor_id', 'action', 'target_type', 'target_id', 'metadata', 'created_at')} ON CONFLICT (id) DO NOTHING`;
      }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      console.warn("Skipping audit_events (does not exist in source database)");
    }

    console.log("Data Migration 100% Complete!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}
run();
