import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getOptionalPublicSupabaseEnv, getPublicSupabaseEnv } from './env';

export type { Database };

/**
 * Create a Supabase client for browser usage (SSR-compatible via @supabase/ssr).
 * Uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env vars.
 */
export function createClient() {
  const { url, anonKey } = getPublicSupabaseEnv();
  return createBrowserClient<Database>(
    url,
    anonKey
  );
}

export function createOptionalClient() {
  const env = getOptionalPublicSupabaseEnv();
  if (!env) return null;
  return createBrowserClient<Database>(
    env.url,
    env.anonKey
  );
}

/**
 * Create a raw Supabase client using @supabase/supabase-js directly.
 * Useful for non-SSR contexts or scripts.
 */
export function createRawClient() {
  const { url, anonKey } = getPublicSupabaseEnv();
  return createSupabaseClient<Database>(
    url,
    anonKey
  );
}
