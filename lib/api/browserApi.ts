import { CSRF_HEADER_NAME } from "@/lib/security/csrfConstants";

let csrfTokenPromise: Promise<string> | null = null;

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Normalize `/api/...` paths to include a trailing slash (Next.js `trailingSlash: true`). */
export function apiPath(path: string): string {
  if (!path.startsWith("/api/")) return path;
  const queryIndex = path.indexOf("?");
  const base = queryIndex === -1 ? path : path.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : path.slice(queryIndex + 1);
  const normalized = base.endsWith("/") ? base : `${base}/`;
  return query ? `${normalized}?${query}` : normalized;
}

export function invalidateCsrfToken(): void {
  csrfTokenPromise = null;
}

export async function ensureCsrfToken(): Promise<string> {
  if (!csrfTokenPromise) {
    csrfTokenPromise = fetch(apiPath("/api/csrf"), { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`CSRF bootstrap failed (${response.status})`);
        }
        const body = (await response.json()) as { token?: string };
        if (!body.token) {
          throw new Error("CSRF bootstrap response missing token");
        }
        return body.token;
      })
      .catch((error) => {
        csrfTokenPromise = null;
        throw error;
      });
  }
  return csrfTokenPromise;
}

export async function browserApiFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = apiPath(input);
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);

  if (MUTATING_METHODS.has(method)) {
    const token = await ensureCsrfToken();
    headers.set(CSRF_HEADER_NAME, token);
  }

  const response = await fetch(url, {
    ...init,
    method,
    headers,
    credentials: init.credentials ?? "include",
  });

  if (response.status === 403 && MUTATING_METHODS.has(method)) {
    invalidateCsrfToken();
  }

  return response;
}
