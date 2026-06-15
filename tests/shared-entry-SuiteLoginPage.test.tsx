import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(site)/login/LoginForm", () => ({
  LoginForm: ({ guestHref }: { guestHref?: string }) => (
    <div data-testid="suite-login-form" data-guest-href={guestHref ?? ""} />
  ),
}));

import { SuiteLoginPage } from "@/features/shared/entry/SuiteLoginPage";

describe("SuiteLoginPage", () => {
  it("renders marketing copy, back link, and embedded login form", () => {
    render(
      <SuiteLoginPage
        eyebrow="Member access"
        title="Sign in to continue"
        description="Return to the shared chooser after authentication."
        guestHref="/guest"
        backHref="/access"
        backLabel="Back to access"
      />,
    );

    expect(screen.getByRole("link", { name: "Back to access" })).toHaveAttribute(
      "href",
      "/access",
    );
    expect(
      screen.getByRole("heading", { name: "Sign in to continue" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("suite-login-form")).toHaveAttribute(
      "data-guest-href",
      "/guest",
    );
    expect(screen.getByRole("link", { name: "Continue as guest instead" })).toHaveAttribute(
      "href",
      "/guest",
    );
  });

  it("opens the assistant from the help button", () => {
    const handler = vi.fn();
    window.addEventListener("oando-assistant:open", handler);

    render(
      <SuiteLoginPage
        eyebrow="Member access"
        title="Sign in"
        description="Authenticate to continue."
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "AI help" }));
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener("oando-assistant:open", handler);
  });
});