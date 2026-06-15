import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { publicEnv } from './publicEnv'

const url = publicEnv.supabaseUrl
const anonKey = publicEnv.supabaseAnonKey

if (!url || !anonKey) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set. ' +
      'See .env.example; copy to .env.local for local dev, or configure in Netlify env for prod.',
  )
}

/**
 * App-wide Supabase client. All reads/writes go through this singleton.
 *
 * Authorization lives in Postgres RLS — do not try to enforce permission
 * checks in the browser. If a call returns empty where you expected rows,
 * the server is telling you the caller isn't entitled to see them.
 */
export const supabase: SupabaseClient = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})



