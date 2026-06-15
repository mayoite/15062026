#!/usr/bin/env node

const DEFAULT_BASE_URL = "https://workingoando.vercel.app";
const args = process.argv.slice(2);

function getArgValue(name) {
  const prefix = `${name}=`;
  const direct = args.find((arg) => arg.startsWith(prefix));
  if (direct) return direct.slice(prefix.length);
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return "";
}

function normalizeBaseUrl(value) {
  const raw = (value || "").trim();
  if (!raw) return DEFAULT_BASE_URL;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, "");
}

async function fetchCheck(url, options = {}) {
  const startedAt = Date.now();
  try {
    const response = await fetch(url, { redirect: "follow" });
    const durationMs = Date.now() - startedAt;
    const body = options.readBody ? await response.text() : "";
    return {
      url,
      ok: response.ok,
      status: response.status,
      durationMs,
      body,
      error: "",
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    return {
      url,
      ok: false,
      status: 0,
      durationMs,
      body: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function pushFailure(failures, check, reason) {
  failures.push({
    url: check.url,
    status: check.status,
    reason,
    error: check.error,
  });
}

async function main() {
  const baseUrl = normalizeBaseUrl(
    getArgValue("--url") || process.env.HOSTED_BASE_URL || DEFAULT_BASE_URL,
  );
  const routePaths = ["/", "/products/", "/contact/", "/api/categories/", "/api/nav-categories/"];
  const routeChecks = [];
  const failures = [];

  for (const path of routePaths) {
    const readBody = path === "/" || path.startsWith("/api/");
    const check = await fetchCheck(`${baseUrl}${path}`, { readBody });
    routeChecks.push(check);
    if (!check.ok) {
      pushFailure(failures, check, "route_status_not_ok");
      continue;
    }
    if (path === "/" && check.body.includes("Missing Supabase runtime env vars")) {
      pushFailure(failures, check, "missing_supabase_text_found_on_homepage");
    }
  }

  const categoriesCheck = routeChecks.find((item) => item.url.endsWith("/api/categories/"));
  if (categoriesCheck?.ok) {
    try {
      const payload = JSON.parse(categoriesCheck.body || "[]");
      if (!Array.isArray(payload) || payload.length === 0) {
        pushFailure(failures, categoriesCheck, "categories_payload_empty");
      }
    } catch {
      pushFailure(failures, categoriesCheck, "categories_payload_not_json");
    }
  }

  const navCategoriesCheck = routeChecks.find((item) =>
    item.url.endsWith("/api/nav-categories/"),
  );
  if (navCategoriesCheck?.ok) {
    try {
      const payload = JSON.parse(navCategoriesCheck.body || "{}");
      const groups = Array.isArray(payload?.groups) ? payload.groups : [];
      if (groups.length === 0) {
        pushFailure(failures, navCategoriesCheck, "nav_categories_groups_empty");
      }
    } catch {
      pushFailure(failures, navCategoriesCheck, "nav_categories_payload_not_json");
    }
  }

  const directImagePath = "/images/catalog/oando-tables--opus-2/image-1.jpg";
  const optimizerPath = `/_next/image/?url=${encodeURIComponent(directImagePath)}&w=128&q=75`;
  const directImageCheck = await fetchCheck(`${baseUrl}${directImagePath}`);
  const optimizerCheck = await fetchCheck(`${baseUrl}${optimizerPath}`);

  if (!directImageCheck.ok) {
    pushFailure(failures, directImageCheck, "direct_image_not_ok");
  }
  if (!optimizerCheck.ok && optimizerCheck.status !== 404) {
    pushFailure(failures, optimizerCheck, "next_image_optimizer_not_ok");
  }

  const summary = {
    timestamp: new Date().toISOString(),
    baseUrl,
    routeChecks: routeChecks.map(({ body, ...rest }) => rest),
    imageChecks: [
      { ...directImageCheck, body: undefined },
      { ...optimizerCheck, body: undefined },
    ],
    failures,
    ok: failures.length === 0,
  };

  console.log(JSON.stringify(summary, null, 2));
  process.exit(summary.ok ? 0 : 1);
}

main();
