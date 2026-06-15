import { renderHook } from "@testing-library/react";
import { useUnitPreference } from "../useUnitPreference";

// Mock the units module
jest.mock("../../lib/units", () => ({
  getUserUnit: jest.fn().mockReturnValue("cm"),
  setUserUnit: jest.fn(),
  formatMeasurement: jest.fn((mm, unit) => `${mm}${unit}`),
  fromMm: jest.fn((mm, unit) => unit === "cm" ? mm / 10 : mm),
  toMm: jest.fn((val, unit) => unit === "cm" ? val * 10 : val),
  getAvailableUnits: jest.fn().mockReturnValue(["mm", "cm", "m", "in", "ft"]),
  getUnitLabel: jest.fn((u) => u.toUpperCase()),
  getUnitShortLabel: jest.fn((u) => u),
}));

describe("useUnitPreference", () => {
  it("returns current unit", () => {
    const { result } = renderHook(() => useUnitPreference());
    expect(result.current.unit).toBe("cm");
  });

  it("provides format function", () => {
    const { result } = renderHook(() => useUnitPreference());
    expect(result.current.format(100)).toBe("100cm");
  });

  it("provides fromMm conversion", () => {
    const { result } = renderHook(() => useUnitPreference());
    expect(result.current.fromMm(100)).toBe(10);
  });

  it("provides toMm conversion", () => {
    const { result } = renderHook(() => useUnitPreference());
    expect(result.current.toMm(10)).toBe(100);
  });

  it("provides available units", () => {
    const { result } = renderHook(() => useUnitPreference());
    expect(result.current.availableUnits).toContain("cm");
    expect(result.current.availableUnits).toContain("mm");
  });

  it("provides label functions", () => {
    const { result } = renderHook(() => useUnitPreference());
    expect(result.current.getLabel("cm")).toBe("CM");
    expect(result.current.getShortLabel("cm")).toBe("cm");
  });
});
