import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { invalidateCsrfToken } from "@/lib/api/browserApi";
import {
  areAllFlagsInGroupEnabled,
  DEFAULT_FLAGS,
  updateFeatureFlagInSupabase,
  fetchFeatureFlagsFromSupabase,
  getAllFlagNames,
  getAllFlagsGrouped,
  getFeatureFlags,
  getFlagMetadata,
  getFlagsInGroup,
  isAnyFlagInGroupEnabled,
  isFeatureEnabled,
  resetFeatureFlags,
  setFeatureFlags,
  updateMultipleFeatureFlagsInSupabase,
} from "@/features/planner/lib/featureFlags";

function mockFetch(
  handler: (url: string, init?: RequestInit) => Promise<Response>,
) {
  return vi.spyOn(globalThis, "fetch").mockImplementation((input, init) =>
    handler(String(input), init),
  );
}

function csrfThen(handler: (url: string, init?: RequestInit) => Promise<Response>) {
  return mockFetch(async (url, init) => {
    if (url.includes("/api/csrf")) {
      return {
        ok: true,
        json: async () => ({ token: "test-csrf" }),
      } as Response;
    }
    return handler(url, init);
  });
}

describe("planner feature flags", () => {
  beforeEach(() => {
    localStorage.clear();
    resetFeatureFlags();
    invalidateCsrfToken();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetFeatureFlags();
  });

  it("returns defaults and merges local overrides", () => {
    resetFeatureFlags();
    localStorage.setItem("oofpl-feature-flags", JSON.stringify({ floorPlanImport: true }));

    const flags = getFeatureFlags();
    expect(flags.floorPlanImport).toBe(true);
    expect(flags.planner2D).toBe(DEFAULT_FLAGS.planner2D);
  });

  it("persists updates and answers per-flag and per-group queries", () => {
    setFeatureFlags({ exportPanorama: true, floorPlanImport: true });
    expect(isFeatureEnabled("exportPanorama")).toBe(true);
    expect(getFlagsInGroup("export").exportPdf).toBe(true);
    expect(isAnyFlagInGroupEnabled("export")).toBe(true);
    expect(areAllFlagsInGroupEnabled("mobile")).toBe(true);
  });

  it("exposes metadata helpers for admin surfaces", () => {
    expect(getAllFlagNames().length).toBeGreaterThan(10);
    expect(getFlagMetadata("planner2D").group).toBe("Core");
    expect(getAllFlagsGrouped().some((group) => group.group === "Export")).toBe(true);
  });

  it("fetches remote flags and updates cache", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ flags: { offlineMode: true } }),
    } as Response);

    const remote = await fetchFeatureFlagsFromSupabase();
    expect(remote).toEqual({ offlineMode: true });
    expect(isFeatureEnabled("offlineMode")).toBe(true);
    fetchMock.mockRestore();
  });

  it("handles failed remote fetch and patch operations", async () => {
    mockFetch(async () => ({
      ok: false,
      statusText: "Forbidden",
      json: async () => ({}),
    } as Response));
    expect(await fetchFeatureFlagsFromSupabase()).toBeNull();

    csrfThen(async () => ({
      ok: true,
      json: async () => ({}),
    } as Response));
    expect(await updateFeatureFlagInSupabase("exportSvg", false)).toEqual({ success: true });
    expect(isFeatureEnabled("exportSvg")).toBe(false);

    csrfThen(async () => ({
      ok: false,
      statusText: "Bad Request",
      json: async () => ({ error: "Invalid flag" }),
    } as Response));
    expect(await updateMultipleFeatureFlagsInSupabase({ exportBoq: false })).toEqual({
      success: false,
      error: "Invalid flag",
    });
  });

  it("ignores invalid localStorage payloads", () => {
    localStorage.setItem("oofpl-feature-flags", "{bad-json");
    resetFeatureFlags();
    expect(getFeatureFlags().planner2D).toBe(true);
  });

  it("reports disabled group checks and unknown patch failures", async () => {
    setFeatureFlags({ exportPanorama: false });
    expect(areAllFlagsInGroupEnabled("export")).toBe(false);

    csrfThen(async () => ({
      ok: false,
      statusText: "Server Error",
      json: async () => {
        throw new Error("bad json");
      },
    } as Response));
    expect(await updateFeatureFlagInSupabase("exportBoq", true)).toEqual({
      success: false,
      error: "Server Error",
    });
  });

  it("uses the in-memory cache and clears localStorage on reset failures", () => {
    setFeatureFlags({ exportPdf: false });
    expect(getFeatureFlags().exportPdf).toBe(false);
    expect(getFeatureFlags()).toBe(getFeatureFlags());

    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => resetFeatureFlags()).not.toThrow();
  });

  it("handles localStorage write failures and network errors in patch helpers", async () => {
    const setItemSpy = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => setFeatureFlags({ exportPng: false })).not.toThrow();
    expect(getFeatureFlags().exportPng).toBe(false);
    setItemSpy.mockRestore();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    expect(await updateFeatureFlagInSupabase("exportPng", true)).toEqual({
      success: false,
      error: "offline",
    });
    expect(await updateMultipleFeatureFlagsInSupabase({ exportPng: false })).toEqual({
      success: false,
      error: "offline",
    });
  });

  it("batch-updates remote flags and hydrates cache from successful fetch", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ flags: { exportBoq: false, aiFurnish: false } }),
    } as Response);

    const remote = await fetchFeatureFlagsFromSupabase();
    expect(remote).toEqual({ exportBoq: false, aiFurnish: false });
    expect(isFeatureEnabled("exportBoq")).toBe(false);

    csrfThen(async () => ({
      ok: true,
      json: async () => ({}),
    } as Response));
    expect(await updateMultipleFeatureFlagsInSupabase({ exportSvg: true, exportPng: false })).toEqual({
      success: true,
    });
    expect(isFeatureEnabled("exportSvg")).toBe(true);
    expect(isFeatureEnabled("exportPng")).toBe(false);
  });
});
