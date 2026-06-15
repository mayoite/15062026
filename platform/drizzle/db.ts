import "server-only";

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// --- 1. Drizzle ORM (DigitalOcean Postgres) ---
// Used by the modern Buddy Planner features (Offices, Teams, Audits)
let cachedDb: ReturnType<typeof drizzle> | null = null;

function getDrizzleDb() {
  if (cachedDb) {
    return cachedDb;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing in environment variables. Please add it to .env.local");
  }

  const client = postgres(connectionString, { prepare: false });
  cachedDb = drizzle(client);
  return cachedDb;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, property, receiver) {
    return Reflect.get(getDrizzleDb(), property, receiver);
  },
});

// --- 2. Supabase Client (Legacy Catalog) ---
// Lazy init so `next build` / sitemap generation can run without Supabase env.
let cachedSupabase: SupabaseClient | null = null;

export function hasSupabasePublicEnv(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );
}

function getSupabaseClient(): SupabaseClient {
  if (cachedSupabase) return cachedSupabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing in environment variables.");
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in environment variables.");
  }

  cachedSupabase = createClient(url, anonKey);
  return cachedSupabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, property, receiver) {
    const client = getSupabaseClient();
    const value = Reflect.get(client, property, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
