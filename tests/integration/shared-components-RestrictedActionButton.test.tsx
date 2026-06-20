import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RestrictedActionButton } from "@/features/shared/components/RestrictedActionButton";

describe("RestrictedActionButton", () => {
  it("renders a disabled action with sign-in guidance", () => {
    render(<RestrictedActionButton>Save layout</RestrictedActionButton>);

    const button = screen.getByRole("button", { name: "Save layout" });
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveClass("pointer-events-none");
  });
});