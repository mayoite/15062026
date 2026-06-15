import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import Fuse from "fuse.js";
import { getCatalog } from '@/features/catalog/getProducts';
import { buildRequestedCategoryCatalog } from '@/features/catalog/categories';
import { rateLimit } from "@/lib/rateLimit";
import { SITE_URL } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";

type SearchContext = "header" | "mobile";
type SearchResultType = "product" | "category" | "page";
type SearchSource = "ai" | "local";
type SearchRankingMode = "ai" | "local" | "static-fallback";

interface SearchIndexEntry {
  id: string;
  title: string;
  href: string;
  type: SearchResultType;
  keywords: string[];
}

interface SearchResultItem {
  id: string;
  title: string;
  href: string;
  type: SearchResultType;
  source: SearchSource;
}

const STATIC_PAGES: Array<Pick<SearchIndexEntry, "id" | "title" | "href">> = [
  { id: "page:products", title: "All Products", href: "/products" },
  { id: "page:solutions", title: "Solutions", href: "/solutions" },
  { id: "page:projects", title: "Projects", href: "/projects" },
  { id: "page:portfolio", title: "Portfolio", href: "/portfolio" },
  { id: "page:trusted-by", title: "Trusted By", href: "/trusted-by" },
  { id: "page:about", title: "About Us", href: "/about" },
  { id: "page:contact", title: "Contact", href: "/contact" },
  { id: "page:sustainability", title: "Sustainability", href: "/sustainability" },
  {
    id: "page:refund-policy",
    title: "Refund and Return Policy",
    href: "/refund-and-return-policy",
  },
  { id: "page:showrooms", title: "Showrooms", href: "/showrooms" },
];

let cache: { ts: number; entries: SearchIndexEntry[] } = {
  ts: 0,
  entries: [],
};

function sanitizeLimit(limit: number | undefined): number {
  if (!limit || Number.isNaN(limit)) return 8;
  return Math.min(12, Math.max(1, Math.floor(limit)));
}

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

async function buildSearchIndex(): Promise<SearchIndexEntry[]> {
  const now = Date.now();
  if (cache.entries.length > 0 && now - cache.ts < 5 * 60 * 1000) {
    return cache.entries;
  }

  const baseCatalog = await getCatalog();
  const requestedCatalog = buildRequestedCategoryCatalog(baseCatalog);
  const entries: SearchIndexEntry[] = [];

  for (const category of requestedCatalog) {
    entries.push({
      id: `category:${category.id}`,
      title: category.name,
      href: `/products/${category.id}`,
      type: "category",
      keywords: [category.description, category.id],
    });

    for (const series of category.series) {
      for (const product of series.products) {
        const slug = product.slug || product.id;
        entries.push({
          id: `product:${slug}`,
          title: product.name,
          href: `/products/${category.id}/${slug}`,
          type: "product",
          keywords: [
            category.name,
            category.id,
            series.name,
            product.description || "",
            ...(product.metadata?.tags || []),
            ...(product.metadata?.useCase || []),
            ...(product.metadata?.material || []),
          ],
        });
      }
    }
  }

  for (const page of STATIC_PAGES) {
    entries.push({
      ...page,
      type: "page",
      keywords: [page.title, page.href],
    });
  }

  cache = { ts: now, entries };
  return entries;
}

function buildFallbackIndex(): SearchIndexEntry[] {
  return STATIC_PAGES.map((page) => ({
    ...page,
    type: "page",
    keywords: [page.title, page.href],
  }));
}

function localSearch(entries: SearchIndexEntry[], query: string, limit: number): SearchResultItem[] {
  const trimmedQuery = normalize(query);
  if (trimmedQuery.length < 2) return [];

  const fuse = new Fuse(entries, {
    keys: ["title", "keywords"],
    threshold: 0.35,
    ignoreLocation: true,
  });

  const raw = fuse.search(trimmedQuery, { limit: Math.max(24, limit * 3) });
  const deduped = new Set<string>();
  const ranked: SearchResultItem[] = [];

  for (const hit of raw) {
    if (deduped.has(hit.item.href)) continue;
    deduped.add(hit.item.href);
    ranked.push({
      id: hit.item.id,
      title: hit.item.title,
      href: hit.item.href,
      type: hit.item.type,
      source: "local",
    });
    if (ranked.length >= limit) break;
  }

  return ranked;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function aiRank(
  query: string,
  context: SearchContext,
  localCandidates: SearchResultItem[],
): Promise<string[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || localCandidates.length === 0) return [];

  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": SITE_URL,
      "X-Title": "One&Only Navigation Search",
    },
  });

  const compact = localCandidates
    .map((item) => `- ${item.id} | ${item.title} | ${item.type} | ${item.href}`)
    .join("\n");

  const completion = await withTimeout(
    client.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || "openrouter/auto",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "Rank navigation results for furniture website intent. Return strict JSON only: {\"ids\":[\"...\"]}",
        },
        {
          role: "user",
          content: `Context: ${context}\nQuery: ${query}\nCandidates:\n${compact}`,
        },
      ],
      response_format: { type: "json_object" },
    }),
    1200,
  );

  const content = completion.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(content) as { ids?: string[] };
  return Array.isArray(parsed.ids) ? parsed.ids : [];
}

async function executeSearch(
  query: string,
  limit: number,
  context: SearchContext,
  started: number,
) {
  let indexFallbackUsed = false;
  let index: SearchIndexEntry[] = [];

  try {
    index = await buildSearchIndex();
  } catch {
    index = buildFallbackIndex();
    indexFallbackUsed = true;
  }

  const localResults = localSearch(index, query, limit);
  let results = localResults;
  const fallbackUsed = indexFallbackUsed;
  let rankingMode: SearchRankingMode = indexFallbackUsed ? "static-fallback" : "local";

  if (process.env.OPENROUTER_API_KEY && localResults.length > 0) {
    try {
      const rankedIds = await aiRank(query, context, localResults);
      if (rankedIds.length > 0) {
        const byId = new Map(localResults.map((item) => [item.id, item]));
        const ordered = rankedIds
          .map((id) => byId.get(id))
          .filter((item): item is SearchResultItem => Boolean(item));
        const seen = new Set(ordered.map((item) => item.id));
        const tail = localResults.filter((item) => !seen.has(item.id));
        results = [...ordered, ...tail].slice(0, limit).map((item) => ({
          ...item,
          source: "ai",
        }));
        rankingMode = "ai";
      }
    } catch {
      rankingMode = indexFallbackUsed ? "static-fallback" : "local";
    }
  }

  return {
    results,
    fallbackUsed,
    rankingMode,
    latencyMs: Date.now() - started,
  };
}

export async function POST(req: NextRequest) {
  const started = Date.now();
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "127.0.0.1";
  const limitRes = await rateLimit(ip, 20, 60000);

  if (!limitRes.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "X-RateLimit-Reset": limitRes.reset.toString() } },
    );
  }

  try {
    const body = (await req.json()) as {
      query?: string;
      limit?: number;
      context?: SearchContext;
    };

    const query = body.query?.trim() || "";
    const limit = sanitizeLimit(body.limit);
    const context: SearchContext = body.context === "mobile" ? "mobile" : "header";

    if (query.length < 2) {
      return NextResponse.json(
        {
          results: [],
          fallbackUsed: false,
          rankingMode: "local",
          latencyMs: Date.now() - started,
          error: {
            code: "QUERY_TOO_SHORT",
            message: "Query must be at least 2 characters.",
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json(await executeSearch(query, limit, context, started));
  } catch {
    return NextResponse.json(
      {
        results: [],
        fallbackUsed: true,
        rankingMode: "static-fallback",
        latencyMs: Date.now() - started,
        error: {
          code: "SEARCH_FAILED",
          message: "Unable to process search request right now.",
        },
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const started = Date.now();
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "127.0.0.1";
  const limitRes = await rateLimit(ip, 20, 60000);
  if (!limitRes.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "X-RateLimit-Reset": limitRes.reset.toString() } },
    );
  }

  try {
    const query = req.nextUrl.searchParams.get("q")?.trim() || "";
    const limit = sanitizeLimit(Number(req.nextUrl.searchParams.get("limit") || "8"));
    const contextRaw = req.nextUrl.searchParams.get("context");
    const context: SearchContext = contextRaw === "mobile" ? "mobile" : "header";

    if (query.length < 2) {
      return NextResponse.json(
        {
          results: [],
          fallbackUsed: false,
          rankingMode: "local",
          latencyMs: Date.now() - started,
          error: {
            code: "QUERY_TOO_SHORT",
            message: "Query must be at least 2 characters.",
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json(await executeSearch(query, limit, context, started));
  } catch {
    return NextResponse.json(
      {
        results: [],
        fallbackUsed: true,
        rankingMode: "static-fallback",
        latencyMs: Date.now() - started,
        error: {
          code: "SEARCH_FAILED",
          message: "Unable to process search request right now.",
        },
      },
      { status: 500 },
    );
  }
}
