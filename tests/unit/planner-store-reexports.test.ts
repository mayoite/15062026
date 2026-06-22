import { describe, expect, it } from "vitest";

import { floorTemplates, instantiateTemplate } from "@/features/planner/store/floorTemplates";
import { floorTemplates as deprecatedTemplates } from "@/features/planner/store/templates";
import { appendSnapshot, MAX_VERSIONS } from "@/features/planner/store/versionStore";

describe("planner store re-exports", () => {
  it("re-exports floor templates through templates.ts", () => {
    expect(deprecatedTemplates).toBe(floorTemplates);
    const blank = floorTemplates.find((template) => template.id === "blank")!;
    const instantiated = instantiateTemplate(blank);
    expect(instantiated.walls).toEqual([]);
  });

  it("re-exports versioning helpers through versionStore.ts", () => {
    expect(MAX_VERSIONS).toBeGreaterThan(0);
    const key = "project-1";
    appendSnapshot(key, { label: "v1", data: { walls: [] } });
    appendSnapshot(key, { label: "v2", data: { walls: [{ id: "w1" }] } });
    expect(appendSnapshot).toBeDefined();
  });
});
