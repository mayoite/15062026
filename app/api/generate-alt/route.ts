import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { rateLimit } from "@/lib/rateLimit";
import { env } from "@/lib/env.server";

type CategoryConfig = { label: string; avoid: string[] };

const CATEGORY_CONTEXT: Record<string, CategoryConfig> = {
  seating: {
    label: "ergonomic office seating",
    avoid: ["table", "storage", "locker"],
  },
  workstations: {
    label: "modular workstation desk system",
    avoid: ["chair", "sofa", "locker"],
  },
  tables: {
    label: "office table system",
    avoid: ["chair", "storage", "locker"],
  },
  storages: {
    label: "office storage cabinet and locker system",
    avoid: ["chair", "table", "sofa"],
  },
  "soft-seating": {
    label: "soft seating lounge furniture",
    avoid: ["workstation", "locker", "storage"],
  },
  education: {
    label: "education furniture system",
    avoid: ["workstation", "lounge", "sofa"],
  },
  "mesh-chair": {
    label: "mesh ergonomic office chair",
    avoid: ["table", "storage"],
  },
  "leather-chair": {
    label: "premium leather office chair",
    avoid: ["table", "storage"],
  },
  "fabric-chair": {
    label: "fabric upholstered office chair",
    avoid: ["table", "storage"],
  },
  "training-chair": {
    label: "training room office chair",
    avoid: ["table", "locker"],
  },
  "study-chair": {
    label: "training and study office chair",
    avoid: ["table", "locker"],
  },
  "cafe-chair": {
    label: "cafe and breakout seating chair",
    avoid: ["workstation", "locker"],
  },
  "height-adjustable-series": {
    label: "height adjustable workstation desk",
    avoid: ["chair", "locker"],
  },
  "desking-series": {
    label: "modular desking workstation",
    avoid: ["chair", "locker"],
  },
  "panel-series": {
    label: "panel based workstation system",
    avoid: ["chair", "lounge"],
  },
  "cabin-tables": {
    label: "executive cabin office table",
    avoid: ["chair", "storage"],
  },
  "meeting-tables": {
    label: "meeting and conference table",
    avoid: ["chair", "storage"],
  },
  "training-tables": {
    label: "training room table",
    avoid: ["chair", "locker"],
  },
  "cafe-tables": {
    label: "cafe and breakout table",
    avoid: ["chair", "storage"],
  },
  "prelam-storage": {
    label: "prelam office storage cabinet",
    avoid: ["chair", "table"],
  },
  "metal-storage": {
    label: "metal office storage cabinet",
    avoid: ["chair", "table"],
  },
  "compactor-storage": {
    label: "compactor storage system",
    avoid: ["chair", "table"],
  },
  locker: {
    label: "office locker system",
    avoid: ["chair", "table"],
  },
  lounge: {
    label: "lounge soft seating furniture",
    avoid: ["workstation", "locker"],
  },
  sofa: {
    label: "office sofa seating",
    avoid: ["workstation", "locker"],
  },
  collaborative: {
    label: "collaborative soft seating",
    avoid: ["workstation", "storage"],
  },
  pouffee: {
    label: "pouffee and ottoman soft seating",
    avoid: ["workstation", "storage"],
  },
  classroom: {
    label: "classroom education furniture",
    avoid: ["lounge", "sofa"],
  },
  library: {
    label: "library education furniture",
    avoid: ["lounge", "sofa"],
  },
  hostel: {
    label: "hostel education furniture",
    avoid: ["lounge", "sofa"],
  },
  auditorium: {
    label: "auditorium education seating",
    avoid: ["workstation", "storage"],
  },
  "oando-workstations": {
    label: "office workstation desk system",
    avoid: ["chair", "seating", "sofa"],
  },
  "oando-tables": {
    label: "office conference table",
    avoid: ["chair", "seating", "sofa", "workstation"],
  },
  "oando-storage": {
    label: "office storage cabinet locker",
    avoid: ["chair", "seating", "table", "desk"],
  },
  "oando-seating": {
    label: "ergonomic office chair",
    avoid: ["table", "desk", "storage", "cabinet"],
  },
  "oando-chairs": {
    label: "ergonomic office chair",
    avoid: ["table", "desk", "storage", "cabinet"],
  },
  "oando-other-seating": {
    label: "visitor and training seating",
    avoid: ["table", "desk", "storage"],
  },
  "oando-soft-seating": {
    label: "soft seating lounge furniture",
    avoid: ["table", "desk", "storage", "workstation"],
  },
};

function normalizeCategoryLabel(category: string): string {
  return category.replace("oando-", "").replace(/-/g, " ");
}

function fallbackAltText(category: string, name: string): string {
  const ctx = CATEGORY_CONTEXT[category] || {
    label: normalizeCategoryLabel(category),
    avoid: [],
  };
  return `${name} ${ctx.label}`.replace(/\s+/g, " ").trim().slice(0, 120);
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "127.0.0.1";
  const limitRes = await rateLimit(`generate-alt:${ip}`, 10, 60 * 1000);
  if (!limitRes.success) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: { "X-RateLimit-Reset": limitRes.reset.toString() } },
    );
  }

  try {
    const { category, name, description } = await req.json();
    if (!category || !name) {
      return NextResponse.json(
        { error: "category and name are required" },
        { status: 400 }
      );
    }

    const ctx = CATEGORY_CONTEXT[category] || {
      label: normalizeCategoryLabel(category),
      avoid: [],
    };

    const avoidText =
      ctx.avoid.length > 0
        ? `Avoid these words: ${ctx.avoid.join(", ")}.`
        : "Avoid unrelated category words.";

    const prompt = [
      "Generate concise product image alt text for furniture.",
      "Maximum 15 words. Output plain text only.",
      `Category: ${ctx.label}`,
      `Name: ${name}`,
      description ? `Description: ${description}` : "",
      avoidText,
    ]
      .filter(Boolean)
      .join("\n");

    const apiKey =
      env.OPENROUTER_API_KEY_PRIMARY ||
      env.OPENROUTER_API_KEY_BACKUP ||
      env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ altText: fallbackAltText(category, name) });
    }

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
        temperature: 0.3,
        max_tokens: 60,
      });

      const altText =
        completion.choices[0]?.message?.content?.trim() ||
        fallbackAltText(category, name);

      return NextResponse.json({ altText });
    } catch {
      return NextResponse.json({ altText: fallbackAltText(category, name) });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to generate alt text: ${message}` },
      { status: 500 }
    );
  }
}
