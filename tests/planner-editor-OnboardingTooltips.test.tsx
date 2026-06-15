import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OnboardingTooltips } from "@/features/planner/editor/OnboardingTooltips";

describe("OnboardingTooltips", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows tooltip sequence and completes onboarding", () => {
    render(<OnboardingTooltips />);

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(screen.getByText(/Drag furniture/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText(/draw walls/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText(/Ask AI/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByText(/Ask AI/i)).not.toBeInTheDocument();
    expect(localStorage.getItem("planner_onboarded")).toBe("true");
  });

  it("skips immediately and respects disabled flag", () => {
    render(<OnboardingTooltips disabled />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByText(/Drag furniture/i)).not.toBeInTheDocument();

    localStorage.removeItem("planner_onboarded");
    const { unmount } = render(<OnboardingTooltips />);
    act(() => {
      vi.advanceTimersByTime(800);
    });
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(localStorage.getItem("planner_onboarded")).toBe("true");
    unmount();
  });
});