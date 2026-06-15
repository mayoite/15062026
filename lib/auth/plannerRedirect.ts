const DEFAULT_REDIRECT = "/choose-product";

export function sanitizeNextPath(
  value: string | null | undefined,
  fallback = DEFAULT_REDIRECT,
): string {
  if (!value) {
    return fallback;
  }

  if (!value.startsWith("/")) {
    return fallback;
  }

  if (value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function buildAccessRedirect(
  nextPath: string | null | undefined,
  fallback = DEFAULT_REDIRECT,
): string {
  const safeNext = sanitizeNextPath(nextPath, fallback);
  return `/access?next=${encodeURIComponent(safeNext)}`;
}

export const sanitizePlannerNextPath = sanitizeNextPath;
