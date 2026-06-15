import { NextResponse } from 'next/server';
import { rateLimit } from "@/lib/rateLimit";

interface AdvisorRequestBody {
  messages: Array<{ role: string; content: string }>;
  plannerType: 'oando' | 'buddy';
}

interface AdvisorResponse {
  reply: string;
  suggestion?: object;
}

type NormalizedMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

function getRequestIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "127.0.0.1"
  );
}

function normalizeMessages(value: unknown): NormalizedMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as Record<string, unknown>;
      const role = candidate.role;
      const content = typeof candidate.content === "string" ? candidate.content.trim().slice(0, 2000) : "";
      if (!content) return null;
      if (role !== "system" && role !== "user" && role !== "assistant") return null;
      return { role, content } as NormalizedMessage;
    })
    .filter((item): item is NormalizedMessage => item !== null)
    .slice(0, 20);
}

/**
 * Mock AI advisor endpoint.
 * In production, this would call an endustry AI provider (OpenAI, Anthropic, etc.).
 * For now it returns a helpful mock response.
 */
export async function POST(request: Request) {
  try {
    const ip = getRequestIp(request);
    const limitRes = await rateLimit(`ai-advisor:${ip}`, 10, 60 * 1000);
    if (!limitRes.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "X-RateLimit-Reset": limitRes.reset.toString() } }
      );
    }

    const body = (await request.json().catch(() => null)) as Partial<AdvisorRequestBody> | null;
    const messages = normalizeMessages(body?.messages);
    if (messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }
    const plannerType = body?.plannerType === 'oando' || body?.plannerType === 'buddy'
      ? body.plannerType
      : null;
    if (!plannerType) {
      return NextResponse.json(
        { error: 'Invalid plannerType' },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage?.content || '';

    // ------------------------------------------------------------------
    // Mock response logic (replace with real AI call in production)
    // ------------------------------------------------------------------
    const isLayoutQuery = /layout|arrange|place|position|floor plan/i.test(userQuery);

    let reply: string;
    let suggestion: object | undefined;

    if (isLayoutQuery) {
      reply = `For your ${plannerType} workspace, I'd recommend an open-plan layout with clustered workstations and a dedicated collaboration zone. This maximizes space efficiency while maintaining ergonomic standards.`;
      suggestion = {
        type: 'layout',
        preset: 'open-plan-cluster',
        zones: ['workstations', 'collaboration', 'focus'],
      };
    } else {
      reply = `Based on your ${plannerType} project requirements, I suggest considering ergonomic seating options combined with height-adjustable desks. This configuration works well for teams of 4-12 people and supports both focused work and team interaction.`;
    }

    const response: AdvisorResponse = {
      reply,
      ...(suggestion ? { suggestion } : {}),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[api/ai/advisor] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
