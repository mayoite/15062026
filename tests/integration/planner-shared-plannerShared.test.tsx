import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildBoq } from "@/features/planner/shared/boq/buildBoq";
import { Catalog } from "@/features/planner/shared/components/Catalog";
import { Inspector } from "@/features/planner/shared/components/Inspector";
import { ThemeProvider } from "@/features/planner/shared/components/ThemeProvider";
import type { CatalogItem } from "@/features/planner/shared/catalog/types";
import * as PlannerSharedComponents from "@/features/planner/shared/components";
import * as PlannerSharedExports from "@/features/planner/shared/index";

vi.mock("next/image", () => ({
  default: ({
    alt,
    src,
    fill: _fill,
    unoptimized: _unoptimized,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; unoptimized?: boolean }) => (
    <img alt={alt} src={src} {...props} />
  ),
}));

describe("planner shared surfaces", () => {
  const desk: CatalogItem = {
    id: "desk-1",
    name: "Bench Desk",
    category: "Workstations",
    dimensions: {
      widthMm: 1400,
      depthMm: 700,
      heightMm: 750,
    },
    thumbnail: "/desk.jpg",
    priceInr: 100_000,
  };

  const chair: CatalogItem = {
    id: "chair-1",
    name: "Task Chair",
    category: "Seating",
    dimensions: {
      widthMm: 600,
      depthMm: 600,
      heightMm: 900,
    },
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-06T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("builds grouped BOQ line items from placed planner items", () => {
    const boq = buildBoq(
      [
        { catalogId: "desk-1", name: "Bench Desk" },
        { catalogId: "desk-1", name: "Bench Desk" },
        {
          catalogId: "",
          name: " Focus Chair ",
          category: "Seating",
          widthCm: 65,
          depthCm: 70,
          heightCm: 95,
        },
      ],
      new Map([["desk-1", desk]]),
    );

    expect(boq.generatedAt).toBe("2026-06-06T12:00:00.000Z");
    expect(boq.totalItems).toBe(3);
    expect(boq.lineItems).toEqual([
      {
        catalogId: "",
        name: " Focus Chair ",
        category: "seating",
        quantity: 1,
        unitPriceInr: 0,
        sku: "",
        dimensions: {
          widthMm: 650,
          depthMm: 700,
          heightMm: 950,
        },
      },
      {
        catalogId: "desk-1",
        name: "Bench Desk",
        category: "workstations",
        quantity: 2,
        unitPriceInr: 100_000,
        sku: "",
        dimensions: {
          widthMm: 1400,
          depthMm: 700,
          heightMm: 750,
        },
      },
    ]);
    expect(boq.gstRate).toBe(0.18);
    expect(boq.subtotalInr).toBe(200_000);
    expect(boq.gstAmountInr).toBe(36_000);
    expect(boq.grandTotalInr).toBe(236_000);
  });

  it("renders the shared catalog and passes selections through", () => {
    const onSelect = vi.fn();

    render(<Catalog items={[desk, chair]} onSelect={onSelect} className="planner-grid" />);

    expect(screen.getByRole("img", { name: "Bench Desk" })).toBeInTheDocument();
    expect(screen.getByText("No Image")).toBeInTheDocument();
    expect(screen.getByText("1400")).toBeInTheDocument();
    expect(screen.getByText("900")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Task Chair"));

    expect(onSelect).toHaveBeenCalledWith(chair);
  });

  it("renders the shared inspector empty state and selected item details", () => {
    const positionXRef = React.createRef<HTMLInputElement>();
    const positionYRef = React.createRef<HTMLInputElement>();
    const positionZRef = React.createRef<HTMLInputElement>();
    const rotationYRef = React.createRef<HTMLInputElement>();

    const { rerender } = render(<Inspector className="empty-inspector" />);

    expect(screen.getByText("No item selected")).toBeInTheDocument();

    rerender(
      <Inspector
        selectedItem={desk}
        positionXRef={positionXRef}
        positionYRef={positionYRef}
        positionZRef={positionZRef}
        rotationYRef={rotationYRef}
      />,
    );

    expect(screen.getByRole("heading", { name: "Bench Desk" })).toBeInTheDocument();
    expect(screen.getByText("Workstations")).toBeInTheDocument();
    expect(screen.getByText(/1400 .* 700 .* 750 mm/)).toBeInTheDocument();
    expect(positionXRef.current).toHaveValue(0);
    expect(positionYRef.current).toHaveValue(0);
    expect(positionZRef.current).toHaveValue(0);
    expect(rotationYRef.current).toHaveValue(0);
  });

  it("loads theme tokens from the CDN and exposes planner-shared exports", async () => {
    vi.useRealTimers();
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        name: "studio-dark",
        payload_jsonb: {
          "--block-theme-panel": "#123456",
          "--surface-card": "#ffffff",
        },
      }),
    } as Response);

    render(
      <ThemeProvider defaultTheme="studio-dark">
        <div>Planner Ready</div>
      </ThemeProvider>,
    );

    await screen.findByText("Planner Ready");
    await waitFor(() => {
      const injectedTheme = document.getElementById("dynamic-block-theme");
      expect(injectedTheme?.textContent).toContain("--block-theme-panel: #123456;");
      expect(injectedTheme?.textContent).toContain("--surface-card: #ffffff;");
    });
    expect(PlannerSharedComponents.ThemeProvider).toBe(ThemeProvider);
    expect(typeof PlannerSharedExports.buildBoq).toBe("function");
    expect(typeof PlannerSharedExports.exportBoqToCsv).toBe("function");
  });

  it("falls back cleanly when the theme fetch fails", async () => {
    vi.useRealTimers();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    render(
      <ThemeProvider>
        <div>Fallback Ready</div>
      </ThemeProvider>,
    );

    await screen.findByText("Fallback Ready");
    expect(warn).toHaveBeenCalled();
  });
});