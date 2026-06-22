import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChangeEvent } from "react";

import { createPlannerDocument } from "@/features/planner/model";
import { LOCAL_CURRENT_DRAFT_ID, VIEWER_PREVIEW_DRAFT_ID } from "@/features/planner/lib/sessionState";

const { getBrowserSessionUser } = vi.hoisted(() => ({
  getBrowserSessionUser: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  getBrowserSessionUser,
}));

import { usePlannerSession } from "@/features/planner/hooks/usePlannerSession";

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() { return store.size; },
    clear() { store.clear(); },
    getItem(key: string) { return store.get(key) ?? null; },
    key(index: number) { return Array.from(store.keys())[index] ?? null; },
    removeItem(key: string) { store.delete(key); },
    setItem(key: string, value: string) { store.set(key, value); },
  };
}

function createSupabaseClient(profileRole: "admin" | "customer" = "customer") {
  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: "00000000-0000-0000-0000-000000000002" } }, error: null })),
    },
    from: vi.fn((table: string) => {
      if (table === "planner_managed_products") {
         return {
           select: vi.fn(() => ({
             order: vi.fn(async () => ({ data: [], error: null }))
           })),
           upsert: vi.fn((payload: unknown) => ({
             select: vi.fn(() => ({
               single: vi.fn(async () => ({ data: { id: "prod-1", ...payload as object }, error: null }))
             }))
           })),
           delete: vi.fn(() => ({
             eq: vi.fn(() => ({
               select: vi.fn(() => ({
                 maybeSingle: vi.fn(async () => ({ data: { id: "prod-1" }, error: null }))
               }))
             }))
           }))
         };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data: { role: profileRole },
              error: null,
            })),
          })),
        })),
      };
    }),
  };
}

function createHookOptions(overrides: Partial<Parameters<typeof usePlannerSession>[0]> = {}) {
  const plannerDocument = createPlannerDocument({ name: "North Bay", itemCount: 2 });
  const setActiveDocumentId = vi.fn();
  const setPlanName = vi.fn();
  const applyPlannerDocument = vi.fn();
  const buildCurrentPlannerDocument = vi.fn(() => plannerDocument);
  const router = { push: vi.fn() };

  return {
    options: {
      activeDocumentId: "cloud-plan-1",
      planName: "North Bay",
      setActiveDocumentId,
      setPlanName,
      supabase: createSupabaseClient() as unknown as Parameters<typeof usePlannerSession>[0]["supabase"],
      router,
      buildCurrentPlannerDocument,
      applyPlannerDocument,
      ...overrides,
    },
    plannerDocument,
    setActiveDocumentId,
    setPlanName,
    applyPlannerDocument,
    buildCurrentPlannerDocument,
    router,
  };
}

describe("usePlannerSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "localStorage", {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
    URL.createObjectURL = vi.fn(() => "blob:planner");
    URL.revokeObjectURL = vi.fn();
    
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ documents: [], plans: [] }),
    } as unknown as Response));
  });

  it("clears cloud inventory when supabase is unavailable", async () => {
    const { options } = createHookOptions({ supabase: null });

    const { result } = renderHook(() => usePlannerSession(options));

    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
    expect(result.current.plannerSavedEntries).toEqual([]);
    expect(result.current.toolbarSessionModeLabel).toBe("Local draft mode");
  });

  it("syncs owner cloud plans for authenticated customers", async () => {
    getBrowserSessionUser.mockResolvedValue({ id: "00000000-0000-0000-0000-000000000002" });
    
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.includes("/api/plans")) {
         return {
           ok: true,
           status: 200,
           json: async () => ({ documents: [{
              id: "cloud-plan-1",
              user_id: "00000000-0000-0000-0000-000000000002",
              name: "Cloud Plan",
              room_width_mm: 5000,
              room_depth_mm: 4000,
              unit_system: "metric",
              item_count: 3,
              updated_at: "2026-06-14T12:00:00.000Z",
           }] })
         } as unknown as Response;
      }
      return { ok: true, status: 200, json: async () => ({}) } as unknown as Response;
    });

    const { options } = createHookOptions();
    const { result } = renderHook(() => usePlannerSession(options));

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    expect(result.current.authRole).toBe("customer");
    expect(result.current.plannerSavedEntries.map((entry) => entry.id)).toEqual([
      "cloud-plan-1",
    ]);
    expect(result.current.toolbarSessionModeLabel).toBe("Cloud + local drafts");
    expect(result.current.getDraftScope("draft-1")).toEqual({
      documentId: "draft-1",
      userId: "00000000-0000-0000-0000-000000000002",
    });
  });

  it("handles cloud save, draft save, load, delete, import, export, and 3d preview flows", async () => {
    getBrowserSessionUser.mockResolvedValue({ id: "00000000-0000-0000-0000-000000000002" });
    
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (init?.method === "PUT") {
         return {
           ok: true, status: 200, json: async () => ({ document: { id: "saved-cloud", name: "Saved Cloud" } })
         } as unknown as Response;
      }
      if (init?.method === "DELETE") {
         return { ok: true, status: 200, json: async () => ({ success: true }) } as unknown as Response;
      }
      if (url.includes("/api/plans/cloud-plan-2")) {
         return { ok: true, status: 200, json: async () => ({ document: createPlannerDocument({ name: "Loaded Cloud" }) }) } as unknown as Response;
      }
      return { ok: true, status: 200, json: async () => ({ documents: [], plans: [] }) } as unknown as Response;
    });

    const { options, setActiveDocumentId, setPlanName, applyPlannerDocument, router } = createHookOptions({
      activeDocumentId: "cloud-plan-1",
    });

    const { result } = renderHook(() => usePlannerSession(options));

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.handleSaveCloud();
    });

    expect(setPlanName).toHaveBeenCalledWith("Saved Cloud");
    expect(setActiveDocumentId).toHaveBeenCalledWith("saved-cloud");

    act(() => {
      result.current.handleSaveDraft();
    });

    expect(result.current.sessionStatusMessage).toContain("Local draft updated");

    await act(async () => {
      await result.current.handleLoadPlan({
        id: "cloud-plan-2",
        name: "Cloud",
        source: "cloud",
        accessMode: "owner",
        canDelete: true,
        updatedAtLabel: "now",
        itemCount: 2,
        detail: "2 x 2 mm",
      });
    });

    expect(applyPlannerDocument).toHaveBeenCalledWith(expect.objectContaining({ name: "Loaded Cloud" }));

    const importedDoc = createPlannerDocument({ name: "Imported Plan" });
    const file = new File([JSON.stringify(importedDoc)], "plan.json", { type: "application/json" });
    file.text = async () => JSON.stringify(importedDoc);
    
    const input = document.createElement("input");
    const clickSpy = vi.spyOn(input, "click");
    Object.defineProperty(input, "files", { value: [file] });

    await act(async () => {
      result.current.handleImportRequest(input);
      await result.current.handleImportFileChange({
        target: input,
        currentTarget: input,
      } as unknown as ChangeEvent<HTMLInputElement>);
    });

    expect(clickSpy).toHaveBeenCalled();
    expect(applyPlannerDocument).toHaveBeenCalledWith(expect.objectContaining({ name: "Imported Plan" }));

    act(() => {
      result.current.handleExportJson();
    });

    expect(result.current.sessionStatusMessage).toBe("Planner JSON exported.");

    act(() => {
      result.current.handleOpen3d();
    });

    expect(router.push).toHaveBeenCalledWith(`/configurator?draft=${VIEWER_PREVIEW_DRAFT_ID}`);
  });
});