import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { rateLimit } from "@/lib/rateLimit";
import { env } from "@/lib/env.server";

type RankMode = "sustainability" | "price" | "material" | "ergonomic";

interface ProductInput {
  id: string;
  name: string;
  description?: string;
  sustainabilityScore?: number;
  priceRange?: string;
  material?: string[];
  bifmaCertified?: boolean;
  isHeightAdjustable?: boolean;
  hasHeadrest?: boolean;
}

const RANK_PROMPTS: Record<RankMode, string> = {
  sustainability:
    "Rank these products from highest to lowest sustainability. Prioritise eco-friendly materials, recycled content, and high eco scores. Return JSON object: {\"ids\": [\"id1\",\"id2\",...]}",
  price:
    "Rank these products from lowest to highest price tier (budget < mid < premium < luxury). Return JSON object: {\"ids\": [\"id1\",\"id2\",...]}",
  material:
    "Rank these products prioritising recycled and sustainable materials first. Return JSON object: {\"ids\": [\"id1\",\"id2\",...]}",
  ergonomic:
    "Rank these products from most to least ergonomic, prioritising BIFMA certification, height-adjustability, and headrest support. Return JSON object: {\"ids\": [\"id1\",\"id2\",...]}",
};

function fallbackSort(products: ProductInput[], rankBy: RankMode): string[] {
  const sorted = [...products];
  if (rankBy === "sustainability") {
    sorted.sort(
      (a, b) => (b.sustainabilityScore || 0) - (a.sustainabilityScore || 0),
    );
  } else if (rankBy === "price") {
    const order: Record<string, number> = {
      budget: 0,
      mid: 1,
      premium: 2,
      luxury: 3,
    };
    sorted.sort(
      (a, b) =>
        (order[a.priceRange || "mid"] ?? 1) -
        (order[b.priceRange || "mid"] ?? 1),
    );
  } else if (rankBy === "material") {
    sorted.sort((a, b) => {
      const aScore = a.material?.some((m) =>
        m.toLowerCase().includes("recycled"),
      )
        ? 1
        : 0;
      const bScore = b.material?.some((m) =>
        m.toLowerCase().includes("recycled"),
      )
        ? 1
        : 0;
      return bScore - aScore;
    });
  } else if (rankBy === "ergonomic") {
    sorted.sort((a, b) => {
      const score = (p: ProductInput) =>
        (p.bifmaCertified ? 3 : 0) +
        (p.isHeightAdjustable ? 2 : 0) +
        (p.hasHeadrest ? 1 : 0);
      return score(b) - score(a);
    });
  }
  return sorted.map((p) => p.id);
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const limitRes = await rateLimit(`filter:${ip}`, 20, 60_000);
    if (!limitRes.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "X-RateLimit-Reset": limitRes.reset.toString() } },
      );
    }

    const { products, category, rankBy } = (await req.json()) as {
      products: ProductInput[];
      category: string;
      rankBy: RankMode;
    };

    if (!products || !rankBy) {
      return NextResponse.json(
        { error: "products and rankBy required" },
        { status: 400 },
      );
    }

    const validModes: RankMode[] = [
      "sustainability",
      "price",
      "material",
      "ergonomic",
    ];
    if (!validModes.includes(rankBy)) {
      return NextResponse.json({ error: "invalid rankBy" }, { status: 400 });
    }

    const apiKey =
      env.OPENROUTER_API_KEY_PRIMARY ||
      env.OPENROUTER_API_KEY_BACKUP ||
      env.OPENAI_API_KEY;
    if (!apiKey || products.length === 0) {
      return NextResponse.json({
        rankedIds: fallbackSort(products, rankBy),
        source: "fallback",
      });
    }

    // Limit to 40 products for token efficiency
    const subset = products.slice(0, 40);
    const productList = subset
      .map((p) => {
        const meta = [
 
          p.sustainabilityScore !== null && p.sustainabilityScore !== undefined ? `eco:${p.sustainabilityScore}` : null,
          p.priceRange ? `price:${p.priceRange}` : null,
          p.material?.length ? `mat:${p.material.join(",")}` : null,
          p.bifmaCertified ? "BIFMA" : null,
          p.isHeightAdjustable ? "height-adj" : null,
          p.hasHeadrest ? "headrest" : null,
        ]
          .filter(Boolean)
          .join("; ");
        return `[${p.id}] ${p.name}${meta ? ` (${meta})` : ""}`;
      })
      .join("\n");

    const prompt = [
      `Category: ${category}`,
      RANK_PROMPTS[rankBy],
      "Products to rank:",
      productList,
    ].join("\n");

    const useOpenRouter = Boolean(
      env.OPENROUTER_API_KEY_PRIMARY || env.OPENROUTER_API_KEY_BACKUP,
    );
    const openai = new OpenAI({
      apiKey,
      ...(useOpenRouter && {
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://oando.co.in",
          "X-Title": "One&Only",
        },
      }),
    });
    const model = useOpenRouter
      ? (process.env.OPENROUTER_MODEL || "openrouter/auto")
      : "gpt-4o-mini";
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 500,
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const ids = Array.isArray(parsed.ids) ? (parsed.ids as string[]) : null;

      if (!ids) {
        return NextResponse.json({
          rankedIds: fallbackSort(subset, rankBy),
          source: "fallback",
        });
      }

      // Append any products not returned by AI at the end
      const ranked = ids.filter((id) =>
        subset.some((p) => p.id === id),
      );
      const rankedSet = new Set(ranked);
      const rest = subset.filter((p) => !rankedSet.has(p.id)).map((p) => p.id);

      return NextResponse.json({
        rankedIds: [...ranked, ...rest],
        source: "ai",
      });
    } catch {
      return NextResponse.json({
        rankedIds: fallbackSort(subset, rankBy),
        source: "fallback",
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to rank: ${message}` },
      { status: 500 },
    );
  }
}
