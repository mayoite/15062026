import { describe, expect, it } from "vitest";

import {
  getPlannerTldrawEditor,
  registerPlannerTldrawEditor,
  unregisterPlannerTldrawEditor,
} from "@/features/planner/tldraw/plannerTldrawEditorBridge";

describe("plannerTldrawEditorBridge", () => {
  it("registers and returns the active editor", () => {
    const editor = { id: "mock-editor" } as never;
    registerPlannerTldrawEditor(editor);
    expect(getPlannerTldrawEditor()).toBe(editor);
    unregisterPlannerTldrawEditor(editor);
    expect(getPlannerTldrawEditor()).toBeNull();
  });
});