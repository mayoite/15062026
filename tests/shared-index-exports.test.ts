import { describe, expect, it } from "vitest";

describe("shared index barrels", () => {
  it("exports auth types from the auth index", async () => {
    const auth = await import("@/features/shared/auth/index");
    const state: import("@/features/shared/auth/types").SessionState = {
      status: "unauthenticated",
    };
    expect(auth).toBeDefined();
    expect(state.status).toBe("unauthenticated");
  });

  it("exports CRM types from the CRM index", async () => {
    const crm = await import("@/features/shared/crm/index");
    const client: import("@/features/shared/crm/types").SharedClient = {
      id: "1",
      name: "Acme",
      company: "Acme Corp",
      email: "ops@example.com",
      phone: "555",
      address: "Patna",
      notes: "",
      createdAt: "2026-01-01",
    };
    expect(crm).toBeDefined();
    expect(client.company).toBe("Acme Corp");
  });

  it("exports catalog types from the catalog index", async () => {
    const catalog = await import("@/features/shared/catalog/index");
    expect(catalog).toBeDefined();
    expect(Object.keys(catalog)).toEqual([]);
  });

  it("exports quotes types from the quotes index", async () => {
    const quotes = await import("@/features/shared/quotes/index");
    expect(quotes).toBeDefined();
    expect(Object.keys(quotes)).toEqual([]);
  });

  it("exports analytics types from the analytics index", async () => {
    const analytics = await import("@/features/shared/analytics/index");
    const event: import("@/features/shared/analytics/types").SharedAnalyticsEvent = {
      name: "session_start",
      surface: "planner",
      category: "session",
    };
    expect(analytics).toBeDefined();
    expect(event.surface).toBe("planner");
  });
});