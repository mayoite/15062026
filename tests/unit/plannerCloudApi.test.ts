import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  listOwnerPlansFromApi,
  listAdminPlansFromApi,
  loadPlanFromApi,
  savePlanToApi,
  deletePlanFromApi,
  PlannerCloudApiError,
} from "@/features/planner/persistence/plannerCloudApi";
import { createPlannerDocument } from "../../features/planner/model";

describe("plannerCloudApi", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("listOwnerPlansFromApi", () => {
    it("returns parsed summaries on success", async () => {
      const mockDocuments = [
        {
          id: "00000000-0000-4000-8000-000000000001",
          user_id: "00000000-0000-4000-8000-000000000002",
          name: "Test Plan",
          project_name: null,
          client_name: null,
          prepared_by: null,
          room_width_mm: 5000,
          room_depth_mm: 5000,
          seat_target: 0,
          unit_system: "metric",
          item_count: 5,
          thumbnail_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ documents: mockDocuments }), { status: 200 })
      );

      const result = await listOwnerPlansFromApi();
      expect(result.length).toBe(1);
      expect(result[0]?.id).toBe("00000000-0000-4000-8000-000000000001");
    });

    it("throws PlannerCloudApiError on 401", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }));
      await expect(listOwnerPlansFromApi()).rejects.toThrow(PlannerCloudApiError);
    });

    it("throws PlannerCloudApiError on other errors", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Server error" }), { status: 500 })
      );
      await expect(listOwnerPlansFromApi()).rejects.toThrowError("Server error");
    });
  });

  describe("listAdminPlansFromApi", () => {
    it("returns parsed summaries on success", async () => {
      const mockPlans = [
        {
          id: "00000000-0000-4000-8000-000000000010",
          user_id: "00000000-0000-4000-8000-000000000002",
          name: "Admin Test Plan",
          unit_system: "imperial",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ plans: mockPlans }), { status: 200 })
      );

      const result = await listAdminPlansFromApi();
      expect(result.length).toBe(1);
      expect(result[0]?.id).toBe("00000000-0000-4000-8000-000000000010");
      expect(result[0]?.name).toBe("Admin Test Plan");
      expect(result[0]?.unit_system).toBe("imperial");
    });

    it("throws PlannerCloudApiError on 403", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 403 }));
      await expect(listAdminPlansFromApi()).rejects.toThrow(PlannerCloudApiError);
    });
  });

  describe("loadPlanFromApi", () => {
    it("returns document on success", async () => {
      const doc = createPlannerDocument();
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ document: doc }), { status: 200 })
      );

      const result = await loadPlanFromApi("00000000-0000-4000-8000-000000000001");
      expect(result).not.toBeNull();
      expect(result?.id).toBe(doc.id);
    });

    it("returns null on 404", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 404 }));
      const result = await loadPlanFromApi("missing-doc");
      expect(result).toBeNull();
    });

    it("throws PlannerCloudApiError on invalid payload", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ document: "not-an-object" }), { status: 200 })
      );
      await expect(loadPlanFromApi("00000000-0000-4000-8000-000000000001")).rejects.toThrow(PlannerCloudApiError);
    });
  });

  describe("savePlanToApi", () => {
    it("returns saved document on success", async () => {
      const doc = createPlannerDocument();
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ document: doc }), { status: 200 })
      );

      const result = await savePlanToApi(doc);
      expect(result.id).toBe(doc.id);
    });

    it("throws PlannerCloudApiError on 401", async () => {
      const doc = createPlannerDocument();
      vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }));
      await expect(savePlanToApi(doc)).rejects.toThrow(PlannerCloudApiError);
    });

    it("throws PlannerCloudApiError on missing document in response", async () => {
      const doc = createPlannerDocument();
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );
      await expect(savePlanToApi(doc)).rejects.toThrow(PlannerCloudApiError);
    });
  });

  describe("deletePlanFromApi", () => {
    it("returns true on success", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      const result = await deletePlanFromApi("00000000-0000-4000-8000-000000000001");
      expect(result).toBe(true);
    });

    it("returns false on 404", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 404 }));

      const result = await deletePlanFromApi("00000000-0000-4000-8000-000000000001");
      expect(result).toBe(false);
    });

    it("throws PlannerCloudApiError on 401", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }));
      await expect(deletePlanFromApi("00000000-0000-4000-8000-000000000001")).rejects.toThrow(PlannerCloudApiError);
    });
  });
});

