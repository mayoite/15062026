import { describe, expect, it } from "vitest";

import { cn } from "@/features/planner/canvas-fabric/lib/utils";

describe("canvas-fabric cn", () => {
  it("merges plain class strings", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("resolves conditional objects to included classes", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });

  it("dedupes conflicting tailwind classes keeping the last", () => {
    // twMerge: later conflicting utility wins.
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});

