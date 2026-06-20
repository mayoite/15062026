import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RoomPresetsModal } from "@/features/planner/canvas-fabric/RoomPresetsModal";
import { FURNISHINGS } from "@/features/planner/canvas-fabric/models/furnishings";

describe("RoomPresetsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <RoomPresetsModal open={false} onClose={vi.fn()} onApply={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the dialog with preset cards when open", () => {
    render(<RoomPresetsModal open onClose={vi.fn()} onApply={vi.fn()} />);
    expect(screen.getByRole("dialog", { name: "Room presets" })).toBeInTheDocument();
    // Each room preset is rendered as a card button.
    const cards = screen.getAllByRole("button").filter((b) =>
      b.className.includes("frp-preset-card"),
    );
    expect(cards).toHaveLength(FURNISHINGS.rooms.length);
  });

  it("applies a preset and closes when a card is clicked", () => {
    const onClose = vi.fn();
    const onApply = vi.fn();
    render(<RoomPresetsModal open onClose={onClose} onApply={onApply} />);
    const cards = screen.getAllByRole("button").filter((b) =>
      b.className.includes("frp-preset-card"),
    );
    fireEvent.click(cards[0]!);
    expect(onApply).toHaveBeenCalledWith(FURNISHINGS.rooms[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it("closes via the close (X) button", () => {
    const onClose = vi.fn();
    render(<RoomPresetsModal open onClose={onClose} onApply={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("closes via the backdrop button", () => {
    const onClose = vi.fn();
    render(<RoomPresetsModal open onClose={onClose} onApply={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("closes via the Start blank footer button", () => {
    const onClose = vi.fn();
    render(<RoomPresetsModal open onClose={onClose} onApply={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Start blank" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on Escape key", () => {
    const onClose = vi.fn();
    render(<RoomPresetsModal open onClose={onClose} onApply={vi.fn()} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("formats room dimensions as millimetres in each card meta", () => {
    render(<RoomPresetsModal open onClose={vi.fn()} onApply={vi.fn()} />);
    const first = FURNISHINGS.rooms[0]!;
    const expected = `${Math.round(first.width * 25.4).toLocaleString()} mm × ${Math.round(first.height * 25.4).toLocaleString()} mm`;
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});
