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

vi.mock("@/features/planner/components/Providers", () => ({
  Providers: ({ children }: { children: ReactNode }) => (
    <div data-testid="planner-providers">{children}</div>
  ),
}));

vi.mock("@/features/planner/onboarding/ProjectSetupGate", () => ({
  ProjectSetupGate: ({
    guestMode = false,
    planId,
    children,
  }: {
    guestMode?: boolean;
    planId?: string;
    children: ReactNode;
  }) => (
    <div
      data-testid="project-setup-gate"
      data-guest-mode={guestMode ? "true" : "false"}
      data-plan-id={planId ?? ""}
    >
      {children}
    </div>
  ),
}));

vi.mock("@/features/planner/ui/PlannerCanvasEnhancements", () => ({
  PlannerCanvasEnhancements: ({ guestMode = false }: { guestMode?: boolean }) => (
    <div
      data-testid="planner-canvas-enhancements"
      data-guest-mode={guestMode ? "true" : "false"}
    />
  ),
}));

import { PlannerWorkspaceRoute } from "@/features/planner/ui/PlannerWorkspaceRoute";

describe("PlannerWorkspaceRoute", () => {
  afterEach(() => {
    vi.clearAllMocks();
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
