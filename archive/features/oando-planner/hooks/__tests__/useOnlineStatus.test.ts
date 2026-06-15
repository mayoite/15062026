import { renderHook, act } from "@testing-library/react";
import { useOnlineStatus } from "../useOnlineStatus";

// Mock offlineStorage
jest.mock("../../data/offlineStorage", () => ({
  offlineStorage: {
    listSyncQueue: jest.fn().mockResolvedValue([]),
  },
}));

describe("useOnlineStatus", () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    jest.useFakeTimers();
    Object.defineProperty(global, "navigator", {
      value: { onLine: true },
      writable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    Object.defineProperty(global, "navigator", {
      value: originalNavigator,
      writable: true,
    });
  });

  it("returns initial online status", () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current.isOnline).toBe(true);
  });

  it("returns queueDepth of 0 initially", () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current.queueDepth).toBe(0);
  });

  it("updates isOnline when offline event fires", () => {
    const { result } = renderHook(() => useOnlineStatus());
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current.isOnline).toBe(false);
  });

  it("updates isOnline when online event fires", () => {
    const { result } = renderHook(() => useOnlineStatus());
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current.isOnline).toBe(false);
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current.isOnline).toBe(true);
  });
});
