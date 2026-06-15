type PublicSupabaseEnv = {
  url: string;
  anonKey: string;
};

function readEnv(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return trimmed;
}

export function getOptionalPublicSupabaseEnv(): PublicSupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  return url && anonKey ? { url, anonKey } : null;
}

export function hasPublicSupabaseEnv(): boolean {
  return Boolean(getOptionalPublicSupabaseEnv());
}

/**
 * Check if Supabase is configured without throwing.
 * Returns true if both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set and non-empty.
 * Safe to call in server components or middleware.
 */
export function isSupabaseConfigAvailable(): boolean {
  return hasPublicSupabaseEnv();
}

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  return {
    url: readEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };
}
