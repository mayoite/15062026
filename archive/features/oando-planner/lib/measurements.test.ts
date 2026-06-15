
import {
  formatFeetAndInches,
  formatMeasurementInputValue,
  parseMeasurementInput,
} from "./measurements";

describe("planner measurements", () => {
  it("formats imperial values to the nearest inch", () => {
    expect(formatFeetAndInches(2032)).toBe(`6' 8"`);
  });

  it("round-trips displayed imperial values back to canonical millimeters", () => {
    const formatted = formatMeasurementInputValue(2438, "ft-in");

    expect(formatted).toBe(`8' 0"`);
    expect(parseMeasurementInput(formatted, "ft-in")).toBe(2438);
  });

  it("parses imperial inspector inputs in supported formats", () => {
    expect(parseMeasurementInput(`6' 8"`, "ft-in")).toBe(2032);
    expect(parseMeasurementInput("6 8", "ft-in")).toBe(2032);
    expect(parseMeasurementInput('80"', "ft-in")).toBe(2032);
  });

  it("parses metric inspector inputs and rejects invalid measurements", () => {
    expect(parseMeasurementInput("1,200 mm", "mm")).toBe(1200);
    expect(parseMeasurementInput("0", "mm")).toBeNull();
    expect(parseMeasurementInput("-40", "mm")).toBeNull();
    expect(parseMeasurementInput("desk", "ft-in")).toBeNull();
  });

  it("converts cm and m metric inputs to canonical millimeters", () => {
    expect(parseMeasurementInput("120 cm", "mm")).toBe(1200);
    expect(parseMeasurementInput("1.2 m", "mm")).toBe(1200);
    expect(parseMeasurementInput("2m", "mm")).toBe(2000);
    expect(parseMeasurementInput("50cm", "mm")).toBe(500);
    // bare number stays in millimeters
    expect(parseMeasurementInput("1500", "mm")).toBe(1500);
  });
});
