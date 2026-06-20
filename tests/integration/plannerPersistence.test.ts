import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/platform/drizzle/db", () => ({ db: {} }));

import { createPlannerDocument } from "@/features/planner/model/plannerDocument";
import {
  planRowToAdminDetail,
  planRowToAdminSummary,
  planRowToDocument,
} from "@/features/planner/store/plannerPersistence";


describe("plannerPersistence row mapping", () => {
  it("round-trips PlannerDocument through drizzle row mapping", () => {
    const source = createPlannerDocument({
      name: "North Bay",
      projectName: "HQ Refresh",
      clientName: "Contoso",
      roomWidthMm: 7200,
      roomDepthMm: 5400,
      seatTarget: 12,
      itemCount: 4,
      sceneJson: { shapes: [{ id: "shape-1" }] },
    });

    const row = {
      id: "550e8400-e29b-41d4-a716-446655440010",
      userId: "550e8400-e29b-41d4-a716-446655440001",
      name: source.name,
      engine: "oando",
      payload: source,
      thumbnailUrl: null,
      status: "draft",
      createdAt: new Date("2026-06-14T00:00:00.000Z"),
      updatedAt: new Date("2026-06-14T12:00:00.000Z"),
    };

    const restored = planRowToDocument(row);

    expect(restored.name).toBe("North Bay");
    expect(restored.projectName).toBe("HQ Refresh");
    expect(restored.clientName).toBe("Contoso");
    expect(restored.roomWidthMm).toBe(7200);
    expect(restored.itemCount).toBe(4);
    expect(restored.sceneJson).toEqual({ shapes: [{ id: "shape-1" }] });
    expect(restored.updatedAt).toBe("2026-06-14T12:00:00.000Z");
  });

  it("maps drizzle rows to admin summaries and detail payloads", () => {
    const document = createPlannerDocument({
      name: "Executive Floor",
      projectName: "Client A",
      itemCount: 8,
    });
    const row = {
      id: "550e8400-e29b-41d4-a716-446655440010",
      userId: "550e8400-e29b-41d4-a716-446655440001",
      name: document.name,
      engine: "oando",
      payload: document,
      thumbnailUrl: null,
      status: "active",
      createdAt: new Date("2026-06-14T00:00:00.000Z"),
      updatedAt: new Date("2026-06-14T00:00:00.000Z"),
    };

    const summary = planRowToAdminSummary(row);
    const detail = planRowToAdminDetail(row);

    expect(summary.title).toBe("Executive Floor");
    expect(summary.item_count).toBe(8);
    expect(summary.status).toBe("active");
    expect(detail.review_status).toBe("approved");
    expect(detail.review_features).toEqual({ status: false, comments: false });
  });
});