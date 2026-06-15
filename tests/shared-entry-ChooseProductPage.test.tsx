import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChooseProductPage } from "@/features/shared/entry/ChooseProductPage";

describe("ChooseProductPage", () => {
  it("renders guest mode with the guest canvas entry link", () => {
    render(<ChooseProductPage guestMode authenticated={false} />);

    expect(screen.getByText("Guest access")).toBeInTheDocument();
    expect(screen.getByText("Guest path")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open guest canvas/i })).toHaveAttribute(
      "href",
      "/planner/guest",
    );
    expect(screen.queryByRole("link", { name: "Open portal" })).not.toBeInTheDocument();
  });

  it("renders member mode with authenticated portal link", () => {
    render(<ChooseProductPage guestMode={false} authenticated />);

    expect(screen.getByText("Member access")).toBeInTheDocument();
    expect(screen.getByText("Member path")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open member canvas/i })).toHaveAttribute(
      "href",
      "/planner/canvas",
    );
    expect(screen.getByRole("link", { name: "Open portal" })).toHaveAttribute(
      "href",
      "/portal",
    );
  });

  it("shows access check pending when not authenticated and not guest", () => {
    render(<ChooseProductPage guestMode={false} authenticated={false} />);

    expect(screen.getByText("Access check pending")).toBeInTheDocument();
  });
});