import { describe, expect, it } from "vitest";

import {
  buildChatSuggestionChips,
  resolveSpaceSuggestDefaults,
} from "@/features/planner/ai/aiAdvisorConfig";
import type { PlannerProjectMetadata } from "@/features/planner/onboarding/projectSetup";

const METADATA: PlannerProjectMetadata = {
  projectName: "Patna Support Hub",
  city: "Patna",
  floorAreaSqFt: 3200,
  primaryPurpose: "meeting-rooms",
  seatTarget: 24,
  completedAt: "2026-06-14T00:00:00.000Z",
};

describe("aiAdvisorConfig", () => {
  it("resolves defaults from project metadata", () => {
    expect(resolveSpaceSuggestDefaults(METADATA)).toEqual({
      seatCount: 24,
      purpose: "meeting-rooms",
      floorAreaSqFt: 3200,
    });
  });

  it("builds purpose-aware chat chips", () => {
    const chips = buildChatSuggestionChips(METADATA);
    expect(chips[0]).toContain("24");
    expect(chips[0].toLowerCase()).toContain("meeting rooms");
    expect(chips[2]).toContain("phone booths");
  });
});