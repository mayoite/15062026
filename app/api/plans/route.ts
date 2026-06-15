import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import {
  buildPlannerDocumentFromPortalPublishData,
  type PlannerPortalPublishData,
} from "@/features/planner/store/plannerPublish";
import {
  listPlannerDocumentsFromStore,
  savePlannerDocumentToStore,
} from "@/features/planner/store/plannerSaves";
import { rateLimit } from "@/lib/rateLimit";

type PublishBody = {
  id?: string;
  projectName?: string;
  data?: Record<string, unknown>;
  status?: string;
};

function getRequestIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "127.0.0.1"
  );
}

export async function GET(req: NextRequest) {
  const ip = getRequestIp(req);
  const limitRes = await rateLimit(`plans:get:${ip}`, 20, 60 * 1000);
  if (!limitRes.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "X-RateLimit-Reset": limitRes.reset.toString() } },
    );
  }

  const supabase = await createServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id ?? null;

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const documents = await listPlannerDocumentsFromStore({ userId });
    return NextResponse.json({ documents });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Failed to list plans: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const ip = getRequestIp(req);
  const limitRes = await rateLimit(`plans:post:${ip}`, 15, 60 * 1000);
  if (!limitRes.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "X-RateLimit-Reset": limitRes.reset.toString() } },
    );
  }

  const body = (await req.json().catch(() => ({}))) as PublishBody;
  const id = typeof body.id === "string" ? body.id.trim() : "";
  const projectName = typeof body.projectName === "string" ? body.projectName.trim() : "";
  const data = body.data;

  if (!id) {
    return NextResponse.json({ error: "Plan id is required" }, { status: 400 });
  }
  if (!projectName) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }
  if (!data || typeof data !== "object") {
    return NextResponse.json({ error: "Plan data is required" }, { status: 400 });
  }
  const status: "draft" | "active" = body.status === "draft" ? "draft" : "active";

  const supabase = await createServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id ?? null;

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required to publish to portal" },
      { status: 401 },
    );
  }

  const publishData = {
    projectName,
    walls: Array.isArray(data.walls) ? data.walls : [],
    rooms: Array.isArray(data.rooms) ? data.rooms : [],
    furniture: Array.isArray(data.furniture) ? data.furniture : [],
    doors: Array.isArray(data.doors) ? data.doors : [],
    windows: Array.isArray(data.windows) ? data.windows : [],
    measurements: Array.isArray(data.measurements) ? data.measurements : [],
    zones: Array.isArray(data.zones) ? data.zones : [],
    textLabels: Array.isArray(data.textLabels) ? data.textLabels : [],
    structuralElements: Array.isArray(data.structuralElements) ? data.structuralElements : [],
    backgroundImage: data.backgroundImage ?? null,
  } satisfies PlannerPortalPublishData;

  const document = buildPlannerDocumentFromPortalPublishData(publishData, { status });

  try {
    await savePlannerDocumentToStore(document, {
      userId,
      saveId: id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Failed to publish plan: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    id,
    portalPath: `/portal/${id}`,
  });
}
