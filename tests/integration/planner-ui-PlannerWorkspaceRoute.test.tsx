import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/dynamic", () => ({
  default: () =>
    function MockPlannerWorkspace(props: { guestMode?: boolean; planId?: string }) {
      return (
        <div
          data-testid="planner-workspace"
          data-guest-mode={props.guestMode ? "true" : "false"}
          data-plan-id={props.planId ?? ""}
        />
      );
    },
}));

import * as ProvidersMod from "@/features/planner/components/Providers";
import * as ProjectSetupGateMod from "@/features/planner/onboarding/ProjectSetupGate";
import * as PlannerCanvasEnhancementsMod from "@/features/planner/ui/PlannerCanvasEnhancements";

import { PlannerWorkspaceRoute } from "@/features/planner/ui/PlannerWorkspaceRoute";

describe("PlannerWorkspaceRoute", () => {
  beforeEach(() => {
    vi.spyOn(ProvidersMod, "Providers").mockImplementation(({ children }: { children: ReactNode }) => (
      <div data-testid="planner-providers">{children}</div>
    ));

    vi.spyOn(ProjectSetupGateMod, "ProjectSetupGate").mockImplementation(({ guestMode = false, planId, children }: { guestMode?: boolean; planId?: string; children: ReactNode }) => (
      <div data-testid="project-setup-gate" data-guest-mode={guestMode ? "true" : "false"} data-plan-id={planId ?? ""}>
        {children}
      </div>
    ));

    vi.spyOn(PlannerCanvasEnhancementsMod, "PlannerCanvasEnhancements").mockImplementation(({ guestMode = false }: { guestMode?: boolean }) => (
      <div data-testid="planner-canvas-enhancements" data-guest-mode={guestMode ? "true" : "false"} />
    ));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("wires member workspace mode through the route shell", () => {
    render(<PlannerWorkspaceRoute planId="plan-42" />);

    expect(screen.getByTestId("planner-providers")).toBeInTheDocument();
    expect(screen.getByTestId("project-setup-gate")).toHaveAttribute("data-guest-mode", "false");
    expect(screen.getByTestId("project-setup-gate")).toHaveAttribute("data-plan-id", "plan-42");
    expect(screen.getByTestId("planner-workspace")).toHaveAttribute("data-guest-mode", "false");
    expect(screen.getByTestId("planner-workspace")).toHaveAttribute("data-plan-id", "plan-42");
    expect(screen.getByTestId("planner-canvas-enhancements")).toHaveAttribute("data-guest-mode", "false");
  });

  it("keeps guest mode consistent across onboarding and canvas enhancements", () => {
    render(<PlannerWorkspaceRoute guestMode />);

    expect(screen.getByTestId("project-setup-gate")).toHaveAttribute("data-guest-mode", "true");
    expect(screen.getByTestId("planner-workspace")).toHaveAttribute("data-guest-mode", "true");
    expect(screen.getByTestId("planner-canvas-enhancements")).toHaveAttribute("data-guest-mode", "true");
    expect(screen.getByTestId("planner-workspace")).toHaveAttribute("data-plan-id", "");
  });
});
