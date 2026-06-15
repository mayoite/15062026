import { renderHook } from "@testing-library/react";
import { useEscapeDismiss } from "../useEscapeDismiss";
import { fireEvent } from "@testing-library/react";

describe("useEscapeDismiss", () => {
  it("calls onDismiss when Escape is pressed", () => {
    const onDismiss = jest.fn();
    renderHook(() => useEscapeDismiss(onDismiss, true));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not call onDismiss when inactive", () => {
    const onDismiss = jest.fn();
    renderHook(() => useEscapeDismiss(onDismiss, false));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("does not call onDismiss for other keys", () => {
    const onDismiss = jest.fn();
    renderHook(() => useEscapeDismiss(onDismiss, true));
    fireEvent.keyDown(document, { key: "Enter" });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("cleans up listener on unmount", () => {
    const onDismiss = jest.fn();
    const { unmount } = renderHook(() => useEscapeDismiss(onDismiss, true));
    unmount();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
