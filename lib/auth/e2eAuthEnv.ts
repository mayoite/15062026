type EnvSource = Partial<Record<string, string | undefined>>;

export interface E2EAuthEnv {
  publicSupabaseUrl: string;
  publicSupabaseAnonKey: string;
  adminEmail: string;
  adminPassword: string;
  userEmail: string;
  userPassword: string;
}

export interface E2EAuthSeedEnv {
  publicSupabaseUrl: string;
  serviceRoleKey: string;
}

function readRequiredEnv(env: EnvSource, name: string): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function readSupabasePublicKey(env: EnvSource): string {
  return (
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    ""
  );
}

export function getE2EAuthEnv(env: EnvSource = process.env): E2EAuthEnv {
  const publicSupabaseKey = readSupabasePublicKey(env);

  if (!publicSupabaseKey) {
    throw new Error(
      "Missing required env var: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return {
    publicSupabaseUrl: readRequiredEnv(env, "NEXT_PUBLIC_SUPABASE_URL"),
    publicSupabaseAnonKey: publicSupabaseKey,
    adminEmail: readRequiredEnv(env, "E2E_SUPABASE_ADMIN_EMAIL"),
    adminPassword: readRequiredEnv(env, "E2E_SUPABASE_ADMIN_PASSWORD"),
    userEmail: readRequiredEnv(env, "E2E_SUPABASE_USER_EMAIL"),
    userPassword: readRequiredEnv(env, "E2E_SUPABASE_USER_PASSWORD"),
  };
}

export function getE2EAuthSeedEnv(env: EnvSource = process.env): E2EAuthSeedEnv {
  return {
    publicSupabaseUrl: readRequiredEnv(env, "NEXT_PUBLIC_SUPABASE_URL"),
    serviceRoleKey: readRequiredEnv(env, "SUPABASE_SERVICE_ROLE_KEY"),
  };
}
