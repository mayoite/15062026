import { describe, expect, it } from "vitest";

import { plannerDocumentSchema } from "@/features/planner/model/plannerDocument";
import { toPlannerJsonSafe } from "@/features/planner/model/plannerJsonSafe";

describe("toPlannerJsonSafe", () => {
  it("strips undefined and non-finite numbers so sceneJson passes validation", () => {
    const sceneJson = toPlannerJsonSafe({
      type: "cad-suite-planner-scene",
      version: 1,
      items: [{ id: "shape:1", productId: undefined, name: "Desk" }],
      fabricSnapshot: {
        document: {
          store: {
            "shape:1": { props: { widthMm: 120, depthMm: undefined }, meta: { price: 1 } },
          },
          schema: { schemaVersion: 2, sequences: {} },
        },
        session: {
          version: 0,
          pageStates: [{ pageId: "page:page", camera: { x: NaN, y: 0, z: 1 } }],
        },
      },
    });

    const parsed = plannerDocumentSchema.safeParse({
      schemaVersion: 1,
      name: "Safe Plan",
      sceneJson,
    });

    expect(parsed.success).toBe(true);
    expect(JSON.stringify(sceneJson)).not.toContain("undefined");
    expect((sceneJson as Record<string, unknown>).items).toEqual([{ id: "shape:1", name: "Desk" }]);
  });
});
