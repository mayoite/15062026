import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PropsWithChildren } from "react";

import { PlannerErrorBoundary } from "@/features/planner/editor/PlannerErrorBoundary";

function Thrower({ message }: { message: string }) {
  throw new Error(message);
}

describe("PlannerErrorBoundary", () => {
  beforeEach(() => {
    // Suppress React's error logging for the expected thrown child.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children when no error is thrown", () => {
    render(
      <PlannerErrorBoundary>
        <div data-testid="ok">content</div>
      </PlannerErrorBoundary>,
    );
    expect(screen.getByTestId("ok")).toBeInTheDocument();
  });

  it("catches a thrown child and shows the fallback surface with the message", () => {
    render(
      <PlannerErrorBoundary label="3D viewer">
        <Thrower message="boom" />
      </PlannerErrorBoundary>,
    );
    expect(screen.getByText("3D viewer unavailable")).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("uses the default 'Planner' label when none is provided", () => {
    render(
      <PlannerErrorBoundary>
        <Thrower message="fail" />
      </PlannerErrorBoundary>,
    );
    expect(screen.getByText("Planner unavailable")).toBeInTheDocument();
  });

  it("logs the error via componentDidCatch", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <PlannerErrorBoundary label="surface">
        <Thrower message="logged" />
      </PlannerErrorBoundary>,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "[surface] Logging caught error:",
      expect.any(Error),
      expect.any(String),
      expect.any(Object),
    );
  });

  it("resets to children when the Try again button is clicked", () => {
    let shouldThrow = true;
    const Child = ({ id }: { id: string }) => {
      if (shouldThrow) throw new Error("toggle");
      return <div data-testid={`recovered-${id}`}>recovered</div>;
    };

    const Wrapper = ({ id }: PropsWithChildren<{ id: string }>) => (
      <PlannerErrorBoundary>
        <Child id={id} />
      </PlannerErrorBoundary>
    );

    const { rerender } = render(<Wrapper id="first" />);
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();

    // Stop throwing, then reset the boundary.
    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    // Re-render to mount the now-healthy child.
    rerender(<Wrapper id="second" />);
    expect(screen.getByTestId("recovered-second")).toBeInTheDocument();
  });

  it("omits the error message line when the error has no message", () => {
    render(
      <PlannerErrorBoundary>
        <ThrowerWithoutMessage />
      </PlannerErrorBoundary>,
    );
    expect(screen.getByText("Planner unavailable")).toBeInTheDocument();
    // No message line is rendered for empty messages.
    expect(screen.queryByText("Try again")).toBeInTheDocument();
  });
});

function ThrowerWithoutMessage(): JSX.Element {
  throw new Error("");
}
