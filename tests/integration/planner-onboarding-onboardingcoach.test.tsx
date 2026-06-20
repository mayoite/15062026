import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OnboardingCoach, OANDO_ONBOARDING_STEPS } from "@/features/planner/onboarding/OnboardingCoach";

describe("OnboardingCoach", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("shows sequence for oando and completes on last step", () => {
    render(<OnboardingCoach plannerType="oando" steps={OANDO_ONBOARDING_STEPS} />);

    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(screen.getByText("Welcome to One&Only Space Planner")).toBeInTheDocument();
    expect(screen.getByText(/1 of 6/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Drawing Tools")).toBeInTheDocument();

    // advance through
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    }

    // last step
    expect(screen.getByText("Professional Export")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Get Started/ }));
    expect(screen.queryByText("Professional Export")).not.toBeInTheDocument();
    expect(localStorage.getItem("oando-onboarding-complete-oando")).toBe("true");
  });

  it("respects dismissal from localStorage", () => {
    localStorage.setItem("oando-onboarding-complete-oando", "true");
    const { unmount } = render(<OnboardingCoach plannerType="oando" steps={OANDO_ONBOARDING_STEPS} />);
    act(() => {
      vi.advanceTimersByTime(10);
    });
    expect(screen.queryByText("Welcome to One&Only Space Planner")).not.toBeInTheDocument();
    unmount();
  });

  it("handles prev, skip, and different plannerType", () => {
    render(<OnboardingCoach plannerType="buddy" steps={OANDO_ONBOARDING_STEPS.slice(0, 3)} />); // reuse steps for simplicity

    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(screen.getByText("Welcome to One&Only Space Planner")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Drawing Tools")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("Welcome to One&Only Space Planner")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Skip onboarding" }));
    expect(screen.queryByText("Welcome to One&Only Space Planner")).not.toBeInTheDocument();
    expect(localStorage.getItem("oando-onboarding-complete-buddy")).toBe("true");
  });

  it("does not render if no steps", () => {
    render(<OnboardingCoach plannerType="oando" steps={[]} />);
    act(() => {
      vi.advanceTimersByTime(10);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
