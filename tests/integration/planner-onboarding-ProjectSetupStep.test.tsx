import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ProjectSetupStep } from "@/features/planner/onboarding/ProjectSetupStep";

const setupMocks = vi.hoisted(() => ({
  applyProjectSetup: vi.fn(),
  markProjectSetupCompleteInStorage: vi.fn(),
}));

vi.mock("@/features/planner/onboarding/projectSetup", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    applyProjectSetup: setupMocks.applyProjectSetup,
    markProjectSetupCompleteInStorage: setupMocks.markProjectSetupCompleteInStorage,
  };
});

describe("ProjectSetupStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps submit disabled until hydration completes", async () => {
    render(<ProjectSetupStep guestMode onComplete={vi.fn()} />);

    const button = screen.getByRole("button", { name: /preparing workspace/i });
    expect(button).toBeDisabled();

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /start placing furniture/i }),
      ).toBeEnabled(),
    );
  });

  it("applies project setup after hydration", async () => {
    const onComplete = vi.fn();
    render(<ProjectSetupStep guestMode onComplete={onComplete} />);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /start placing furniture/i }),
      ).toBeEnabled(),
    );

    fireEvent.change(screen.getByLabelText("Project name"), {
      target: { value: "Hydrated planner" },
    });
    fireEvent.click(screen.getByRole("button", { name: /start placing furniture/i }));

    await waitFor(() => expect(setupMocks.applyProjectSetup).toHaveBeenCalledTimes(1));
    expect(setupMocks.markProjectSetupCompleteInStorage).toHaveBeenCalledWith(true, undefined);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
