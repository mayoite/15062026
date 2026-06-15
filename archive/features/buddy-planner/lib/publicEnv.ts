function pick(key: string): string | undefined {
  const value = process.env[key]
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export const publicEnv = {
  // Use direct env access so Next can statically inline client-exposed vars.
  supabaseUrl:
    pick('NEXT_PUBLIC_SUPABASE_URL') ??
    (typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'string'
      ? process.env.NEXT_PUBLIC_SUPABASE_URL.trim() || undefined
      : undefined),
  supabaseAnonKey:
    pick('NEXT_PUBLIC_SUPABASE_ANON_KEY') ??
    (typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'string'
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim() || undefined
      : undefined),
  buildId:
    pick('NEXT_PUBLIC_BUILD_ID') ??
    (typeof process.env.NEXT_PUBLIC_BUILD_ID === 'string'
      ? process.env.NEXT_PUBLIC_BUILD_ID.trim() || undefined
      : undefined) ??
    'unknown',
  gitSha:
    pick('NEXT_PUBLIC_GIT_SHA') ??
    (typeof process.env.NEXT_PUBLIC_GIT_SHA === 'string'
      ? process.env.NEXT_PUBLIC_GIT_SHA.trim() || undefined
      : undefined) ??
    'unknown',
  builtAt:
    pick('NEXT_PUBLIC_BUILT_AT') ??
    (typeof process.env.NEXT_PUBLIC_BUILT_AT === 'string'
      ? process.env.NEXT_PUBLIC_BUILT_AT.trim() || undefined
      : undefined) ??
    'unknown',
}

export const appEnv = {
  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV !== 'production',
}



