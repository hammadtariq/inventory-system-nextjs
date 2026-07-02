import { comaSeparatedValues } from "@/utils/comaSeparatedValues";

describe("comaSeparatedValues", () => {
  it("formats positive values with Pakistani-style digit grouping", () => {
    expect(comaSeparatedValues(139.95)).toBe("139.95");
    expect(comaSeparatedValues(1139.95)).toBe("1,139.95");
    expect(comaSeparatedValues(1234567.5)).toBe("12,34,567.50");
  });

  it("formats negative values without inserting a comma next to the sign", () => {
    expect(comaSeparatedValues(-139.95)).toBe("-139.95");
    expect(comaSeparatedValues(-1139.95)).toBe("-1,139.95");
    expect(comaSeparatedValues(-1234567.5)).toBe("-12,34,567.50");
  });

  it("handles values under 100 and zero", () => {
    expect(comaSeparatedValues(9.5)).toBe("9.50");
    expect(comaSeparatedValues(-9.5)).toBe("-9.50");
    expect(comaSeparatedValues(0)).toBe("0.00");
  });

  it("accepts numeric strings", () => {
    expect(comaSeparatedValues("-139.95")).toBe("-139.95");
  });

  it("returns the original value unchanged for non-numeric input", () => {
    expect(comaSeparatedValues("N/A")).toBe("N/A");
  });
});
