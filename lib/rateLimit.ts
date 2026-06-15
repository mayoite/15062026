export type RateLimitInfo = {
  count: number;
  lastReset: number;
};

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

export interface RateLimitBackend {
  check(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

const rateLimitMap = new Map<string, RateLimitInfo>();
let defaultBackendPromise: Promise<RateLimitBackend> | null = null;

function applyMemoryRateLimit(
  key: string,
  limit: number = 20,
  windowMs: number = 60000,
): RateLimitResult {
  const now = Date.now();
  const info = rateLimitMap.get(key) ?? { count: 0, lastReset: now };

  if (now - info.lastReset > windowMs) {
    info.count = 0;
    info.lastReset = now;
  }

  if (info.count >= limit) {
    return { success: false, limit, remaining: 0, reset: info.lastReset + windowMs };
  }

  info.count += 1;
  rateLimitMap.set(key, info);

  return {
    success: true,
    limit,
    remaining: limit - info.count,
    reset: info.lastReset + windowMs,
  };
}

export async function rateLimit(
  key: string,
  limit: number = 20,
  windowMs: number = 60000,
  backend?: RateLimitBackend,
): Promise<RateLimitResult> {
  if (backend) {
    return backend.check(key, limit, windowMs);
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    defaultBackendPromise ??= createSupabaseRateLimitBackend();
    return (await defaultBackendPromise).check(key, limit, windowMs);
  }

  return applyMemoryRateLimit(key, limit, windowMs);
}

export async function createSupabaseRateLimitBackend(): Promise<RateLimitBackend> {
  const { createClient } = await import("@supabase/supabase-js");
  const supabaseUrl = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !supabaseServiceKey) {
    return {
      check(key, limit, windowMs) {
        return Promise.resolve(applyMemoryRateLimit(key, limit, windowMs));
      },
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  return {
    async check(key, limit, windowMs) {
      try {
        const now = Date.now();
        const windowStart = now - windowMs;
        const { data, error } = await supabase
          .from("rate_limits")
          .select("count, window_start")
          .eq("key", key)
          .maybeSingle();

        if (error) {
          return applyMemoryRateLimit(key, limit, windowMs);
        }

        let currentCount = 0;
        let currentWindow = now;

        if (data && typeof data.window_start === "number" && data.window_start > windowStart) {
          currentCount = Number(data.count) || 0;
          currentWindow = data.window_start;
        }

        if (currentCount >= limit) {
          return {
            success: false,
            limit,
            remaining: 0,
            reset: currentWindow + windowMs,
          };
        }

        const nextCount = currentCount + 1;
        const { error: upsertError } = await supabase.from("rate_limits").upsert({
          key,
          count: nextCount,
          window_start: currentWindow,
        });

        if (upsertError) {
          return applyMemoryRateLimit(key, limit, windowMs);
        }

        return {
          success: true,
          limit,
          remaining: limit - nextCount,
          reset: currentWindow + windowMs,
        };
      } catch {
        return applyMemoryRateLimit(key, limit, windowMs);
      }
    },
  };
}
