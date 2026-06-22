import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  savePlannerDocumentToSupabase,
  loadPlannerDocumentFromSupabase,
  listPlannerDocumentsFromSupabase,
  deletePlannerDocumentFromSupabase,
  PlannerStorageError,
} from "@/features/planner/persistence/plannerSaves";
import { createPlannerDocument } from "../../features/planner/model";
import { TEST_USER_ID } from "../fixtures/plannerTestUuids";
import type { SupabaseClient, UserResponse, User } from "@supabase/supabase-js";

describe("plannerSaves", () => {
  let mockSupabase: Partial<SupabaseClient>;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: TEST_USER_ID } as User },
          error: null,
        } as UserResponse),
      } as unknown as SupabaseClient["auth"],
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("savePlannerDocumentToSupabase", () => {
    it("resolves user and saves plan via api", async () => {
      const doc = createPlannerDocument();
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ document: doc }), { status: 200 })
      );

      const result = await savePlannerDocumentToSupabase(mockSupabase as SupabaseClient, doc);
      expect(result.id).toBe(doc.id);
      expect(mockSupabase.auth?.getUser).toHaveBeenCalled();
      expect(fetch).toHaveBeenCalled();
    });

    it("throws PlannerStorageError if user is not authenticated", async () => {
      mockSupabase.auth!.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: new Error("Auth failed"),
      } as UserResponse);

      const doc = createPlannerDocument();
      await expect(
        savePlannerDocumentToSupabase(mockSupabase as SupabaseClient, doc)
      ).rejects.toThrow(PlannerStorageError);
    });

    it("maps api error to PlannerStorageError", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }));
      const doc = createPlannerDocument();
      await expect(
        savePlannerDocumentToSupabase(mockSupabase as SupabaseClient, doc)
      ).rejects.toThrow(PlannerStorageError);
    });
  });

  describe("loadPlannerDocumentFromSupabase", () => {
    it("loads plan via api", async () => {
      const doc = createPlannerDocument();
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ document: doc }), { status: 200 })
      );

      const result = await loadPlannerDocumentFromSupabase(mockSupabase as SupabaseClient, "00000000-0000-4000-8000-000000000001");
      expect(result).not.toBeNull();
      expect(result?.id).toBe(doc.id);
    });

    it("maps api error to PlannerStorageError", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Failed" }), { status: 500 })
      );

      await expect(
        loadPlannerDocumentFromSupabase(mockSupabase as SupabaseClient, "00000000-0000-4000-8000-000000000001")
      ).rejects.toThrow(PlannerStorageError);
    });
  });

  describe("listPlannerDocumentsFromSupabase", () => {
    it("lists owner plans via api", async () => {
      const mockDocuments = [
        {
          id: "00000000-0000-4000-8000-000000000001",
          user_id: "00000000-0000-4000-8000-000000000099",
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

      const result = await listPlannerDocumentsFromSupabase(mockSupabase as SupabaseClient);
      expect(result.length).toBe(1);
      expect(result[0]?.id).toBe("00000000-0000-4000-8000-000000000001");
    });

    it("lists admin plans via api when accessMode is admin", async () => {
      const mockPlans = [
        {
          id: "00000000-0000-4000-8000-000000000003",
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

      const result = await listPlannerDocumentsFromSupabase(mockSupabase as SupabaseClient, {
        accessMode: "admin",
      });
      expect(result.length).toBe(1);
      expect(result[0]?.id).toBe("00000000-0000-4000-8000-000000000003");
    });
  });

  describe("deletePlannerDocumentFromSupabase", () => {
    it("deletes plan via api", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      const result = await deletePlannerDocumentFromSupabase(
        mockSupabase as SupabaseClient,
        "00000000-0000-4000-8000-000000000001"
      );
      expect(result).toBe(true);
    });

    it("throws PlannerStorageError if accessMode is admin", async () => {
      await expect(
        deletePlannerDocumentFromSupabase(mockSupabase as SupabaseClient, "00000000-0000-4000-8000-000000000001", {
          accessMode: "admin",
        })
      ).rejects.toThrow(PlannerStorageError);
    });

    it("maps api error to PlannerStorageError", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }));

      await expect(
        deletePlannerDocumentFromSupabase(mockSupabase as SupabaseClient, "00000000-0000-4000-8000-000000000001")
      ).rejects.toThrow(PlannerStorageError);
    });
  });
});

