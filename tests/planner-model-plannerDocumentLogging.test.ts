import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { plannerDocumentSchema } from "@/features/planner/model/plannerDocument";
import {
  type summarizePlannerSceneJson,
  describePlannerValueSample,
  formatPlannerZodIssues,
  logPlannerSchemaValidationFailure,
  summarizePlannerDocumentInput,
} from "@/features/planner/model/plannerDocumentLogging";

describe("plannerDocumentLogging", () => {
  it("redacts sensitive document fields and summarizes scene structure", () => {
    const summary = summarizePlannerDocumentInput({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "North Bay Executive",
      clientName: "Acme Corp",
      sceneJson: {
        type: "cad-suite-planner-scene",
        version: 1,
        items: [{ id: "shape:1", name: "Desk", meta: { text: "Secret label" } }],
        tldrawSnapshot: {
          document: {
            store: {
              "shape:desk": { id: "shape:desk", type: "geo", props: { w: 120 } },
            },
            schema: { schemaVersion: 2, sequences: {} },
          },
          session: { version: 0 },
        },
      },
    });

    expect(summary.name).toEqual({ kind: "string", length: 19, redacted: true });
    expect(summary.hasClientName).toBe(true);
    expect(summary.clientName).toBeUndefined();
    expect(summary.sceneJson).toMatchObject({
      type: "cad-suite-planner-scene",
      itemCount: 1,
      tldrawSnapshot: {
        storeRecordCount: 1,
        storeShapeTypes: ["geo"],
        redacted: true,
      },
    });
  });

  it("describes invalid values without leaking long strings", () => {
    const sample = describePlannerValueSample({
      props: {
        depthMm: undefined,
        label: "x".repeat(200),
        meta: { price: 42, text: "Hidden desk name" },
      },
    });

    expect(sample).toMatchObject({
      kind: "object",
      sample: {
        props: {
          kind: "object",
          sample: {
            label: { kind: "string", length: 200, redacted: true },
            meta: {
              kind: "object",
              sample: {
                price: { kind: "number", redacted: true },
                text: { kind: "string", length: 16, redacted: true },
              },
            },
          },
        },
      },
    });
  });

  it("formats zod issues with field path and safe sample", () => {
    const payload = {
      schemaVersion: 1,
      name: "Test Plan",
      sceneJson: {
        type: "cad-suite-planner-scene",
        version: 1,
        tldrawSnapshot: {
          document: {
            store: {
              "shape:1": { props: { widthMm: undefined } },
            },
          },
        },
      },
    };

    const parsed = plannerDocumentSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
    if (parsed.success) return;

    const issues = formatPlannerZodIssues(parsed.error, payload);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]?.path.length).toBeGreaterThan(0);
    expect(issues[0]?.code).toBeTruthy();
    expect(JSON.stringify(issues)).not.toContain("Test Plan");
  });

  it("logs structured validation failures", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const schema = z.object({ count: z.number().int().positive() });
    const result = schema.safeParse({ count: 0 });

    expect(result.success).toBe(false);
    if (result.success) return;

    logPlannerSchemaValidationFailure("unit-test", result.error, { count: 0 });

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const payload = errorSpy.mock.calls[0]?.[1] as {
      context: string;
      issues: Array<{ path: string; sample?: unknown }>;
      summary: ReturnType<typeof summarizePlannerSceneJson>;
    };
    expect(payload.context).toBe("unit-test");
    expect(payload.issues[0]?.path).toBe("count");
    expect(payload.issues[0]?.sample).toMatchObject({ kind: "number", value: 0, finite: true });

    errorSpy.mockRestore();
  });
});
