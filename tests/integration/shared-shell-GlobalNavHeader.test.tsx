import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { pathname } = vi.hoisted(() => ({
  pathname: { current: "/dashboard" as string | null },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

import { GlobalNavHeader } from "@/features/shared/shell/GlobalNavHeader";

describe("GlobalNavHeader", () => {
  beforeEach(() => {
    pathname.current = "/dashboard";
  });

  it("marks the dashboard link active on the dashboard route", () => {
    render(<GlobalNavHeader />);

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Portal" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("marks portal and CRM links active on their routes", () => {
    pathname.current = "/portal";
    const { rerender } = render(<GlobalNavHeader />);
    expect(screen.getByRole("link", { name: "Portal" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    pathname.current = "/crm/clients";
    rerender(<GlobalNavHeader />);
    expect(screen.getByRole("link", { name: "Clients" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    pathname.current = "/crm/projects";
    rerender(<GlobalNavHeader />);
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    pathname.current = "/crm/quotes";
    rerender(<GlobalNavHeader />);
    expect(screen.getByRole("link", { name: "Quotes" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    pathname.current = "/admin";
    rerender(<GlobalNavHeader />);
    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("marks choose-product active and treats legacy dashboard paths as dashboard", () => {
    pathname.current = "/choose-product";
    const { rerender } = render(<GlobalNavHeader />);
    expect(screen.getByRole("link", { name: "Choose Product" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    pathname.current = "/oando-planner/dashboard";
    rerender(<GlobalNavHeader />);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});