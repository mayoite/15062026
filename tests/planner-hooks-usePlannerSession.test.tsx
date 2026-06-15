import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChangeEvent } from "react";

import { createPlannerDocument } from "@/features/planner/model";
import { LOCAL_CURRENT_DRAFT_ID, VIEWER_PREVIEW_DRAFT_ID } from "@/features/planner/lib/sessionState";
import type { PlannerSavedEntry } from "@/features/planner/ui/PlannerSessionDialog";

const {
  getBrowserSessionUser,
  listPlannerDocumentsFromSupabase,
  loadPlannerDocumentFromSupabase,
  savePlannerDocumentToSupabase,
  deletePlannerDocumentFromSupabase,
  savePlannerDraftDocument,
  loadPlannerDraftDocument,
  deletePlannerDraftDocument,
  listPlannerManagedProductsFromSupabase,
  upsertPlannerManagedProduct,
  deletePlannerManagedProduct,
  parsePlannerDocumentImportFile,
} = vi.hoisted(() => ({
  getBrowserSessionUser: vi.fn(),
  listPlannerDocumentsFromSupabase: vi.fn(),
  loadPlannerDocumentFromSupabase: vi.fn(),
  savePlannerDocumentToSupabase: vi.fn(),
  deletePlannerDocumentFromSupabase: vi.fn(),
  savePlannerDraftDocument: vi.fn(),
  loadPlannerDraftDocument: vi.fn(),
  deletePlannerDraftDocument: vi.fn(),
  listPlannerManagedProductsFromSupabase: vi.fn(),
  upsertPlannerManagedProduct: vi.fn(),
  deletePlannerManagedProduct: vi.fn(),
  parsePlannerDocumentImportFile: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  getBrowserSessionUser,
}));

vi.mock("@/features/planner/persistence/plannerSaves", () => ({
  deletePlannerDocumentFromSupabase,
  listPlannerDocumentsFromSupabase,
  loadPlannerDocumentFromSupabase,
  savePlannerDocumentToSupabase,
}));

vi.mock("@/features/planner/persistence/plannerDraft", () => ({
  deletePlannerDraftDocument,
  loadPlannerDraftDocument,
  savePlannerDraftDocument,
}));

vi.mock("@/features/planner/catalog/plannerManagedProducts.client", () => ({
  deletePlannerManagedProduct,
  listPlannerManagedProductsFromSupabase,
  upsertPlannerManagedProduct,
}));

vi.mock("@/features/planner/persistence/plannerImport", () => ({
  parsePlannerDocumentImportFile,
}));

import { usePlannerSession } from "@/features/planner/hooks/usePlannerSession";

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

function createSupabaseClient(profileRole: "admin" | "customer" = "customer") {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({
            data: { role: profileRole },
            error: null,
          })),
        })),
      })),
    })),
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
      supabase: createSupabaseClient() as never,
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
    loadPlannerDraftDocument.mockReturnValue(null);
    savePlannerDraftDocument.mockReturnValue(null);
    Object.defineProperty(window, "localStorage", {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
    URL.createObjectURL = vi.fn(() => "blob:planner");
    URL.revokeObjectURL = vi.fn();
  });

  it("clears cloud inventory when supabase is unavailable", async () => {
    const { options } = createHookOptions({ supabase: null });

    const { result } = renderHook(() => usePlannerSession(options));

    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
    expect(result.current.plannerSavedEntries).toEqual([]);
    expect(result.current.toolbarSessionModeLabel).toBe("Local draft mode");
  });

  it("syncs owner cloud plans for authenticated customers", async () => {
    getBrowserSessionUser.mockResolvedValue({ id: "user-123" });
    listPlannerDocumentsFromSupabase.mockResolvedValue([
      {
        id: "cloud-plan-1",
        user_id: "user-123",
        name: "Cloud Plan",
        room_width_mm: 5000,
        room_depth_mm: 4000,
        unit_system: "metric",
        item_count: 3,
        updated_at: "2026-06-14T12:00:00.000Z",
      },
    ]);
    loadPlannerDraftDocument.mockReturnValue(
      createPlannerDocument({
        name: "Local Draft",
        roomWidthMm: 4200,
        roomDepthMm: 3600,
        itemCount: 1,
        updatedAt: "2026-06-14T10:00:00.000Z",
      }),
    );

    const { options } = createHookOptions();
    const { result } = renderHook(() => usePlannerSession(options));

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    expect(result.current.authRole).toBe("customer");
    expect(result.current.plannerSavedEntries.map((entry) => entry.id)).toEqual([
      LOCAL_CURRENT_DRAFT_ID,
      "cloud-plan-1",
    ]);
    expect(result.current.toolbarSessionModeLabel).toBe("Cloud + local drafts");
    expect(result.current.getDraftScope("draft-1")).toEqual({
      documentId: "draft-1",
      userId: "user-123",
    });
  });

  it("loads admin inventory and admin saved entries", async () => {
    getBrowserSessionUser.mockResolvedValue({ id: "admin-1" });
    listPlannerDocumentsFromSupabase
      .mockResolvedValueOnce([{ id: "owner-plan", user_id: "admin-1", name: "Owner", room_width_mm: 1000, room_depth_mm: 1000, unit_system: "metric", item_count: 1, updated_at: "2026-06-14T12:00:00.000Z" }])
      .mockResolvedValueOnce([
        {
          id: "client-plan",
          user_id: "client-9",
          name: "Client Plan",
          room_width_mm: 2000,
          room_depth_mm: 1500,
          unit_system: "imperial",
          item_count: 4,
          updated_at: "2026-06-14T11:00:00.000Z",
        },
      ]);
    listPlannerManagedProductsFromSupabase.mockResolvedValue([
      { id: "prod-1", name: "Chair", updated_at: "2026-06-14T09:00:00.000Z" },
    ]);

    const { options } = createHookOptions({ supabase: createSupabaseClient("admin") as never });
    const { result } = renderHook(() => usePlannerSession(options));

    await waitFor(() => expect(result.current.isAdmin).toBe(true));

    expect(result.current.plannerAdminSavedEntries[0]).toMatchObject({
      id: "client-plan",
      source: "cloud",
      accessMode: "admin",
      ownerLabel: "client-9...nt-9",
      canDelete: false,
    });
    expect(result.current.plannerManagedProducts).toHaveLength(1);
    expect(result.current.toolbarSessionModeLabel).toBe("Admin + cloud drafts");
  });

  it("reports sync errors and stays in local draft mode", async () => {
    loadPlannerDraftDocument.mockReturnValue(null);
    getBrowserSessionUser.mockResolvedValue({ id: "user-err" });
    const failingSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => {
              throw new Error("profile unavailable");
            }),
          })),
        })),
      })),
    };

    const { options } = createHookOptions({ supabase: failingSupabase as never });
    const { result } = renderHook(() => usePlannerSession(options));

    await waitFor(() =>
      expect(result.current.sessionErrorMessage).toContain("Cloud planner workspace is unavailable"),
    );

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.plannerSavedEntries).toEqual([]);
  });

  it("handles cloud save, draft save, load, delete, import, export, and 3d preview flows", async () => {
    getBrowserSessionUser.mockResolvedValue({ id: "user-123" });
    listPlannerDocumentsFromSupabase.mockResolvedValue([]);
    savePlannerDocumentToSupabase.mockResolvedValue({
      id: "saved-cloud",
      name: "Saved Cloud",
    });
    savePlannerDraftDocument.mockReturnValue({ savedAt: "2026-06-14T12:00:00.000Z" });
    loadPlannerDraftDocument.mockReturnValue(createPlannerDocument({ name: "Local Draft" }));
    loadPlannerDocumentFromSupabase.mockResolvedValue(createPlannerDocument({ name: "Loaded Cloud" }));
    deletePlannerDocumentFromSupabase.mockResolvedValue(true);
    parsePlannerDocumentImportFile.mockResolvedValue({
      ok: true,
      document: createPlannerDocument({ name: "Imported Plan" }),
      errors: [],
    });

    const { options, setActiveDocumentId, setPlanName, applyPlannerDocument, router } = createHookOptions({
      supabase: createSupabaseClient("admin") as never,
      activeDocumentId: "cloud-plan-1",
    });

    const { result } = renderHook(() => usePlannerSession(options));

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.handleSaveCloud();
    });

    expect(setPlanName).toHaveBeenCalledWith("Saved Cloud");
    expect(setActiveDocumentId).toHaveBeenCalledWith("saved-cloud");
    expect(result.current.sessionStatusMessage).toContain("Cloud save updated");

    act(() => {
      result.current.handleSaveDraft();
    });

    expect(result.current.sessionStatusMessage).toContain("Local draft updated");

    const localPlan: PlannerSavedEntry = {
      id: LOCAL_CURRENT_DRAFT_ID,
      name: "Local Draft",
      source: "local",
      accessMode: "owner",
      canDelete: true,
      updatedAtLabel: "now",
      itemCount: 1,
      detail: "1 x 1 mm",
    };

    await act(async () => {
      await result.current.handleLoadPlan(localPlan);
    });

    expect(applyPlannerDocument).toHaveBeenCalledWith(expect.objectContaining({ name: "Local Draft" }));

    const cloudPlan: PlannerSavedEntry = {
      id: "cloud-plan-2",
      name: "Cloud",
      source: "cloud",
      accessMode: "owner",
      canDelete: true,
      updatedAtLabel: "now",
      itemCount: 2,
      detail: "2 x 2 mm",
    };

    await act(async () => {
      await result.current.handleLoadPlan(cloudPlan);
    });

    expect(applyPlannerDocument).toHaveBeenCalledWith(expect.objectContaining({ name: "Loaded Cloud" }));

    await act(async () => {
      await result.current.handleDeletePlan(localPlan);
    });

    expect(deletePlannerDraftDocument).toHaveBeenCalled();
    expect(result.current.sessionStatusMessage).toBe("Local draft removed.");

    await act(async () => {
      await result.current.handleDeletePlan(cloudPlan);
    });

    expect(deletePlannerDocumentFromSupabase).toHaveBeenCalled();
    expect(result.current.sessionStatusMessage).toBe("Cloud plan removed.");

    const input = document.createElement("input");
    const clickSpy = vi.spyOn(input, "click");
    const file = new File(['{"name":"Imported Plan"}'], "plan.json", { type: "application/json" });
    Object.defineProperty(input, "files", { value: [file] });

    await act(async () => {
      result.current.handleImportRequest(input);
      await result.current.handleImportFileChange({
        target: input,
        currentTarget: input,
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(clickSpy).toHaveBeenCalled();
    expect(applyPlannerDocument).toHaveBeenCalledWith(expect.objectContaining({ name: "Imported Plan" }));
    expect(result.current.sessionStatusMessage).toContain("Imported planner JSON");

    act(() => {
      result.current.handleExportJson();
    });

    expect(result.current.sessionStatusMessage).toBe("Planner JSON exported.");

    act(() => {
      result.current.handleOpen3d();
    });

    expect(router.push).toHaveBeenCalledWith(`/configurator?draft=${VIEWER_PREVIEW_DRAFT_ID}`);
    expect(result.current.sessionStatusMessage).toContain("Opening 3D preview");
  });

  it("guards unauthenticated cloud actions and missing resources", async () => {
    savePlannerDraftDocument.mockReturnValue(null);
    const { options, applyPlannerDocument } = createHookOptions({ supabase: null, activeDocumentId: null });
    const { result } = renderHook(() => usePlannerSession(options));

    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));

    await act(async () => {
      await result.current.handleSaveCloud();
    });
    expect(result.current.sessionErrorMessage).toBe("Sign in is required for cloud save.");

    act(() => {
      result.current.handleSaveDraft();
    });
    expect(result.current.sessionStatusMessage).toContain("Draft save is unavailable");

    await act(async () => {
      await result.current.handleLoadPlan({
        id: LOCAL_CURRENT_DRAFT_ID,
        name: "Missing",
        source: "local",
        accessMode: "owner",
        canDelete: true,
        updatedAtLabel: "now",
        itemCount: 0,
        detail: "",
      });
    });
    expect(result.current.sessionErrorMessage).toBe("Local draft not found.");

    await act(async () => {
      await result.current.handleLoadPlan({
        id: "cloud-missing",
        name: "Missing Cloud",
        source: "cloud",
        accessMode: "owner",
        canDelete: true,
        updatedAtLabel: "now",
        itemCount: 0,
        detail: "",
      });
    });
    expect(result.current.sessionErrorMessage).toBe("Supabase is not configured in this environment.");

    loadPlannerDocumentFromSupabase.mockResolvedValue(null);
    const { options: cloudOptions } = createHookOptions();
    getBrowserSessionUser.mockResolvedValue({ id: "user-123" });
    listPlannerDocumentsFromSupabase.mockResolvedValue([]);
    const { result: cloudResult } = renderHook(() => usePlannerSession(cloudOptions));

    await waitFor(() => expect(cloudResult.current.isAuthenticated).toBe(true));

    await act(async () => {
      await cloudResult.current.handleLoadPlan({
        id: "missing",
        name: "Missing",
        source: "cloud",
        accessMode: "owner",
        canDelete: true,
        updatedAtLabel: "now",
        itemCount: 0,
        detail: "",
      });
    });
    expect(cloudResult.current.sessionErrorMessage).toBe("Cloud plan not found.");
    expect(applyPlannerDocument).not.toHaveBeenCalled();
  });

  it("blocks admin delete, handles import failures, and manages admin products", async () => {
    getBrowserSessionUser.mockResolvedValue({ id: "admin-1" });
    listPlannerDocumentsFromSupabase.mockResolvedValue([]);
    listPlannerManagedProductsFromSupabase.mockResolvedValue([
      { id: "prod-1", name: "Old Chair", updated_at: "2026-06-13T09:00:00.000Z" },
      { id: "prod-2", name: "Desk", updated_at: "2026-06-12T09:00:00.000Z" },
    ]);
    upsertPlannerManagedProduct.mockResolvedValue({
      id: "prod-3",
      name: "New Chair",
      updated_at: "2026-06-15T09:00:00.000Z",
    });
    deletePlannerManagedProduct.mockResolvedValue(true);

    const { options } = createHookOptions({ supabase: createSupabaseClient("admin") as never });
    const { result } = renderHook(() => usePlannerSession(options));

    await waitFor(() => expect(result.current.isAdmin).toBe(true));

    await act(async () => {
      await result.current.handleDeletePlan({
        id: "client-plan",
        name: "Client",
        source: "cloud",
        accessMode: "admin",
        canDelete: false,
        updatedAtLabel: "now",
        itemCount: 1,
        detail: "",
        ownerUserId: "client-1",
      });
    });
    expect(result.current.sessionErrorMessage).toContain("Admin oversight does not allow");

    const input = document.createElement("input");
    Object.defineProperty(input, "files", { value: [] });
    await act(async () => {
      await result.current.handleImportFileChange({
        target: input,
        currentTarget: input,
      } as ChangeEvent<HTMLInputElement>);
    });

    parsePlannerDocumentImportFile.mockResolvedValue({ ok: false, document: null, errors: ["bad json"] });
    const badFileInput = document.createElement("input");
    const badFile = new File(["{"], "bad.json", { type: "application/json" });
    Object.defineProperty(badFileInput, "files", { value: [badFile] });

    await act(async () => {
      await result.current.handleImportFileChange({
        target: badFileInput,
        currentTarget: badFileInput,
      } as ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.sessionErrorMessage).toBe("bad json");

    await act(async () => {
      await result.current.handleUpsertManagedProduct({
        id: "prod-3",
        name: "New Chair",
        category: "Seating",
        source_slug: "chair",
      });
    });
    expect(result.current.plannerManagedProducts[0]?.id).toBe("prod-3");
    expect(result.current.sessionStatusMessage).toContain("Planner-managed product saved");

    await act(async () => {
      await result.current.handleDeleteManagedProduct("prod-2");
    });
    expect(result.current.plannerManagedProducts.map((entry) => entry.id)).not.toContain("prod-2");

    const { options: customerOptions } = createHookOptions();
    const { result: customerResult } = renderHook(() => usePlannerSession(customerOptions));

    await act(async () => {
      await customerResult.current.handleUpsertManagedProduct({
        id: "prod-4",
        name: "Blocked",
        category: "Seating",
        source_slug: "blocked",
      });
    });
    expect(customerResult.current.sessionErrorMessage).toContain("Admin role is required");
  });

  it("covers admin cloud save branches, owner-label fallbacks, and error handling", async () => {
    getBrowserSessionUser.mockResolvedValue({ id: "admin-1" });
    listPlannerDocumentsFromSupabase.mockResolvedValue([]);
    listPlannerManagedProductsFromSupabase.mockResolvedValue([]);
    loadPlannerDocumentFromSupabase.mockResolvedValue(
      createPlannerDocument({
        id: "550e8400-e29b-41d4-a716-446655440002",
        name: "Client Plan",
      }),
    );
    savePlannerDocumentToSupabase.mockResolvedValue({
      id: "saved-admin",
      name: "Admin Saved",
    });

    const { options, setPlanName, setActiveDocumentId } = createHookOptions({
      supabase: createSupabaseClient("admin") as never,
      activeDocumentId: "cloud-plan-1",
    });

    const { result } = renderHook(() => usePlannerSession(options));

    await waitFor(() => expect(result.current.isAdmin).toBe(true));

    await act(async () => {
      await result.current.handleLoadPlan({
        id: "client-plan",
        name: "Client",
        source: "cloud",
        accessMode: "admin",
        canDelete: false,
        updatedAtLabel: "now",
        itemCount: 1,
        detail: "",
        ownerUserId: "client-42",
      });
    });

    await act(async () => {
      await result.current.handleSaveCloud();
    });

    expect(setPlanName).toHaveBeenCalledWith("Admin Saved");
    expect(setActiveDocumentId).toHaveBeenCalledWith("saved-admin");
    expect(savePlannerDocumentToSupabase).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        accessMode: "admin",
        ownerUserId: "client-42",
        userId: "admin-1",
        saveId: "cloud-plan-1",
      }),
    );

    getBrowserSessionUser.mockResolvedValue({ id: "member-1" });
    listPlannerDocumentsFromSupabase.mockResolvedValue([
      {
        id: "cloud-plan-1",
        user_id: null,
        name: "Ownerless",
        room_width_mm: 1000,
        room_depth_mm: 1000,
        unit_system: "metric",
        item_count: 1,
        updated_at: "2026-06-14T12:00:00.000Z",
      },
    ]);
    loadPlannerDraftDocument.mockReturnValue(null);

    const memberHook = renderHook(() =>
      usePlannerSession(
        createHookOptions({
          supabase: createSupabaseClient("customer") as never,
        }).options,
      ),
    );

    await waitFor(() => expect(memberHook.result.current.isAuthenticated).toBe(true));
    expect(memberHook.result.current.plannerSavedEntries[0]?.ownerLabel).toBeUndefined();

    savePlannerDocumentToSupabase.mockRejectedValue(new Error("save failed"));
    await act(async () => {
      await memberHook.result.current.handleSaveCloud();
    });
    expect(memberHook.result.current.sessionErrorMessage).toBe("save failed");

    getBrowserSessionUser.mockResolvedValue({ id: "member-2" });
    const failingSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => {
              throw "profile down";
            }),
          })),
        })),
      })),
    };
    const errorHook = renderHook(() =>
      usePlannerSession(createHookOptions({ supabase: failingSupabase as never }).options),
    );
    await waitFor(() =>
      expect(errorHook.result.current.sessionErrorMessage).toContain("Cloud planner workspace is unavailable"),
    );
  });

  it("covers additional load, delete, import, export, and managed-product branches", async () => {
    getBrowserSessionUser.mockResolvedValue({ id: "admin-1" });
    listPlannerDocumentsFromSupabase.mockResolvedValue([]);
    listPlannerManagedProductsFromSupabase.mockResolvedValue([]);
    loadPlannerDocumentFromSupabase.mockResolvedValue(createPlannerDocument({ name: "Admin Loaded" }));
    deletePlannerDocumentFromSupabase.mockResolvedValue(false);
    deletePlannerManagedProduct.mockResolvedValue(false);
    savePlannerDraftDocument.mockReturnValue(null);

    const { options, applyPlannerDocument, router } = createHookOptions({
      supabase: createSupabaseClient("admin") as never,
    });
    const { result } = renderHook(() => usePlannerSession(options));

    await waitFor(() => expect(result.current.isAdmin).toBe(true));

    await act(async () => {
      await result.current.handleLoadPlan({
        id: "client-plan",
        name: "Client",
        source: "cloud",
        accessMode: "admin",
        canDelete: false,
        updatedAtLabel: "now",
        itemCount: 1,
        detail: "",
        ownerUserId: "client-77",
      });
    });
    expect(applyPlannerDocument).toHaveBeenCalledWith(expect.objectContaining({ name: "Admin Loaded" }));

    await act(async () => {
      await result.current.handleDeletePlan({
        id: "missing-cloud",
        name: "Missing",
        source: "cloud",
        accessMode: "owner",
        canDelete: true,
        updatedAtLabel: "now",
        itemCount: 0,
        detail: "",
      });
    });
    expect(result.current.sessionStatusMessage).toBe("Cloud plan was not found.");

    parsePlannerDocumentImportFile.mockRejectedValue(new Error("import boom"));
    const importInput = document.createElement("input");
    const importFile = new File(["{"], "bad.json", { type: "application/json" });
    Object.defineProperty(importInput, "files", { value: [importFile] });
    await act(async () => {
      await result.current.handleImportFileChange({
        target: importInput,
        currentTarget: importInput,
      } as ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.sessionErrorMessage).toBe("import boom");

    act(() => {
      result.current.handleOpen3d();
    });
    expect(result.current.sessionErrorMessage).toContain("Unable to prepare 3D preview");

    savePlannerDraftDocument.mockReturnValue({ savedAt: "2026-06-14T12:00:00.000Z" });
    act(() => {
      result.current.handleOpen3d();
    });
    expect(router.push).toHaveBeenCalledWith(`/configurator?draft=${VIEWER_PREVIEW_DRAFT_ID}`);

    await act(async () => {
      await result.current.handleDeleteManagedProduct("prod-9");
    });
    expect(result.current.sessionStatusMessage).toContain("was not found");
    expect(router.push).toHaveBeenCalledWith(`/configurator?draft=${VIEWER_PREVIEW_DRAFT_ID}`);
  });

  it("labels unknown admin owners and handles non-error sync failures", async () => {
    getBrowserSessionUser.mockResolvedValue({ id: "admin-1" });
    listPlannerDocumentsFromSupabase
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "ownerless-plan",
          user_id: null,
          name: "Ownerless",
          room_width_mm: 1000,
          room_depth_mm: 1000,
          unit_system: "metric",
          item_count: 1,
          updated_at: "2026-06-14T12:00:00.000Z",
        },
      ]);
    listPlannerManagedProductsFromSupabase.mockResolvedValue([]);

    const { options } = createHookOptions({ supabase: createSupabaseClient("admin") as never });
    const { result } = renderHook(() => usePlannerSession(options));

    await waitFor(() => expect(result.current.isAdmin).toBe(true));
    expect(result.current.plannerAdminSavedEntries[0]?.ownerLabel).toBe("Unknown owner");

    getBrowserSessionUser.mockResolvedValue({ id: "user-1" });
    const profileErrorSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => {
              throw new Error("profile read failed");
            }),
          })),
        })),
      })),
    };
    const errorHook = renderHook(() =>
      usePlannerSession(createHookOptions({ supabase: profileErrorSupabase as never }).options),
    );
    await waitFor(() => expect(errorHook.result.current.sessionErrorMessage).toContain("profile read failed"));

    getBrowserSessionUser.mockResolvedValue({ id: "" });
    const blankUserHook = renderHook(() =>
      usePlannerSession(createHookOptions({ supabase: createSupabaseClient("customer") as never }).options),
    );
    await waitFor(() => expect(blankUserHook.result.current.isAuthenticated).toBe(false));
  });

  it("handles profile query errors and non-error save failures", async () => {
    getBrowserSessionUser.mockResolvedValue({ id: "member-4" });
    const profileErrorSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data: null,
              error: { message: "profile denied" },
            })),
          })),
        })),
      })),
    };

    const profileHook = renderHook(() =>
      usePlannerSession(createHookOptions({ supabase: profileErrorSupabase as never }).options),
    );

    await waitFor(() =>
      expect(profileHook.result.current.sessionErrorMessage).toBe(
        "Cloud planner workspace is unavailable right now. Staying in local draft mode.",
      ),
    );

    getBrowserSessionUser.mockResolvedValue({ id: "member-5" });
    listPlannerDocumentsFromSupabase.mockResolvedValue([]);
    savePlannerDocumentToSupabase.mockRejectedValue("save exploded");

    const { options } = createHookOptions();
    const saveHook = renderHook(() => usePlannerSession(options));

    await waitFor(() => expect(saveHook.result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await saveHook.result.current.handleSaveCloud();
    });

    expect(saveHook.result.current.sessionErrorMessage).toBe("Unable to save planner document.");
  });

  it("loads owner plans and surfaces non-error load failures", async () => {
    getBrowserSessionUser.mockResolvedValue({ id: "member-6" });
    listPlannerDocumentsFromSupabase.mockResolvedValue([]);
    loadPlannerDocumentFromSupabase.mockRejectedValue("load exploded");

    const { options } = createHookOptions();
    const { result } = renderHook(() => usePlannerSession(options));

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.handleLoadPlan({
        id: "cloud-plan",
        name: "Cloud",
        source: "cloud",
        accessMode: "owner",
        canDelete: true,
        updatedAtLabel: "now",
        itemCount: 1,
        detail: "",
      });
    });

    expect(result.current.sessionErrorMessage).toBe("Unable to load planner document.");
  });

  it("covers authenticated supabase guards, export fallback, and non-error failures", async () => {
    getBrowserSessionUser.mockResolvedValue({ id: "admin-1" });
    listPlannerDocumentsFromSupabase.mockResolvedValue([]);
    listPlannerManagedProductsFromSupabase.mockResolvedValue([]);

    const base = createHookOptions({
      supabase: createSupabaseClient("admin") as never,
      planName: "North Bay",
    });

    const { result, rerender } = renderHook(
      ({ opts }: { opts: typeof base.options }) => usePlannerSession(opts),
      { initialProps: { opts: base.options } },
    );

    await waitFor(() => expect(result.current.isAdmin).toBe(true));

    const anchor = document.createElement("a");
    const clickSpy = vi.spyOn(anchor, "click");
    const createElementSpy = vi.spyOn(document, "createElement").mockReturnValue(anchor);

    act(() => {
      result.current.handleExportJson();
    });

    expect(anchor.download).toBe("north-bay.json");
    expect(clickSpy).toHaveBeenCalled();
    createElementSpy.mockRestore();

    vi.useFakeTimers();

    act(() => {
      rerender({ opts: { ...base.options, supabase: null } });
    });

    await act(async () => {
      await result.current.handleSaveCloud();
    });
    expect(result.current.sessionErrorMessage).toBe("Supabase is not configured in this environment.");

    await act(async () => {
      await result.current.handleDeletePlan({
        id: "cloud-1",
        name: "Cloud",
        source: "cloud",
        accessMode: "owner",
        canDelete: true,
        updatedAtLabel: "now",
        itemCount: 0,
        detail: "",
      });
    });
    expect(result.current.sessionErrorMessage).toBe("Supabase is not configured in this environment.");

    await act(async () => {
      await result.current.handleUpsertManagedProduct({
        id: "prod-x",
        name: "Product",
        category: "Seating",
        source_slug: "product",
      });
    });
    expect(result.current.sessionErrorMessage).toBe("Supabase is not configured in this environment.");

    await act(async () => {
      await result.current.handleDeleteManagedProduct("prod-x");
    });
    expect(result.current.sessionErrorMessage).toBe("Supabase is not configured in this environment.");

    vi.useRealTimers();

    rerender({ opts: base.options });
    await waitFor(() => expect(result.current.isAdmin).toBe(true));

    upsertPlannerManagedProduct.mockRejectedValue("upsert exploded");
    await act(async () => {
      await result.current.handleUpsertManagedProduct({
        id: "prod-y",
        name: "Product Y",
        category: "Seating",
        source_slug: "product-y",
      });
    });
    expect(result.current.sessionErrorMessage).toBe("Unable to save planner-managed product.");

    deletePlannerManagedProduct.mockRejectedValue("delete exploded");
    await act(async () => {
      await result.current.handleDeleteManagedProduct("prod-y");
    });
    expect(result.current.sessionErrorMessage).toBe("Unable to delete planner-managed product.");

    deletePlannerDocumentFromSupabase.mockRejectedValue("delete exploded");
    await act(async () => {
      await result.current.handleDeletePlan({
        id: "cloud-2",
        name: "Cloud",
        source: "cloud",
        accessMode: "owner",
        canDelete: true,
        updatedAtLabel: "now",
        itemCount: 0,
        detail: "",
      });
    });
    expect(result.current.sessionErrorMessage).toBe("Unable to delete planner document.");

    parsePlannerDocumentImportFile.mockRejectedValue("import exploded");
    const importInput = document.createElement("input");
    const importFile = new File(["{}"], "plan.json", { type: "application/json" });
    Object.defineProperty(importInput, "files", { value: [importFile] });
    await act(async () => {
      await result.current.handleImportFileChange({
        target: importInput,
        currentTarget: importInput,
      } as ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.sessionErrorMessage).toBe("Unable to import planner JSON.");

    getBrowserSessionUser.mockResolvedValue({ id: "member-7" });
    const customerHook = renderHook(() =>
      usePlannerSession(createHookOptions({ supabase: createSupabaseClient("customer") as never }).options),
    );
    await waitFor(() => expect(customerHook.result.current.isAuthenticated).toBe(true));
    await act(async () => {
      await customerHook.result.current.handleDeleteManagedProduct("prod-z");
    });
    expect(customerHook.result.current.sessionErrorMessage).toContain("Admin role is required");
  });

  it("exposes session status helpers and dialog state", async () => {
    const { options } = createHookOptions();
    const { result } = renderHook(() => usePlannerSession(options));

    act(() => {
      result.current.reportSessionStatus("Saved");
      result.current.reportSessionError("Failed");
      result.current.clearSessionError();
      result.current.setSessionDialogOpen(true);
    });

    expect(result.current.sessionStatusMessage).toBe("Saved");
    expect(result.current.sessionErrorMessage).toBe(null);
    expect(result.current.sessionDialogOpen).toBe(true);
    expect(result.current.toolbarSessionStateLabel).toBeTruthy();
  });
});