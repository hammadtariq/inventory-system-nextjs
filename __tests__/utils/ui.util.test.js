import { sumItemsPrice } from "@/utils/ui.util";

describe("sumItemsPrice", () => {
  it("returns 0 when data is undefined", () => {
    expect(sumItemsPrice(undefined)).toBe(0);
  });

  it("returns 0 when data is an empty array", () => {
    expect(sumItemsPrice([])).toBe(0);
  });

  it("sums correctly when using ratePerKgs and baleWeightKgs", () => {
    const data = [
      { ratePerKgs: 100, baleWeightKgs: 2 },
      { ratePerKgs: 50, baleWeightKgs: 3 },
    ];
    expect(sumItemsPrice(data)).toBe(350);
  });

  it("sums correctly when using ratePerLbs and baleWeightLbs", () => {
    const data = [
      { ratePerLbs: 10, baleWeightLbs: 5 },
      { ratePerLbs: 20, baleWeightLbs: 4 },
    ];
    expect(sumItemsPrice(data)).toBe(130);
  });

  it("sums correctly when using noOfBales and ratePerBale", () => {
    const data = [
      { noOfBales: 5, ratePerBale: 1000 },
      { noOfBales: 3, ratePerBale: 2000 },
    ];
    expect(sumItemsPrice(data)).toBe(11000);
  });

  it("prioritizes ratePerKgs over other pricing types if present", () => {
    const data = [
      {
        ratePerKgs: 10,
        baleWeightKgs: 5,
        ratePerLbs: 100,
        baleWeightLbs: 2,
        noOfBales: 3,
        ratePerBale: 200,
      },
    ];
    expect(sumItemsPrice(data)).toBe(50);
  });

  it("falls back to ratePerLbs if ratePerKgs is not present or zero", () => {
    const data = [
      {
        ratePerKgs: 0,
        baleWeightKgs: 0,
        ratePerLbs: 50,
        baleWeightLbs: 4,
        noOfBales: 3,
        ratePerBale: 100,
      },
    ];
    expect(sumItemsPrice(data)).toBe(200);
  });

  it("falls back to noOfBales * ratePerBale if others are not usable", () => {
    const data = [
      {
        ratePerKgs: 0,
        baleWeightKgs: 0,
        ratePerLbs: 0,
        baleWeightLbs: 0,
        noOfBales: 2,
        ratePerBale: 1500,
      },
    ];
    expect(sumItemsPrice(data)).toBe(3000);
  });

  it("ignores invalid entries with no useful price data", () => {
    const data = [
      {
        itemName: "Invalid",
        ratePerKgs: 0,
        baleWeightKgs: 0,
        ratePerLbs: 0,
        baleWeightLbs: 0,
        noOfBales: 0,
        ratePerBale: 0,
      },
    ];
    expect(sumItemsPrice(data)).toBe(0);
  });

  it("sums mixed valid and invalid entries correctly", () => {
    const data = [
      {
        ratePerKgs: 10,
        baleWeightKgs: 2,
        noOfBales: 3,
        ratePerBale: 1000,
        ratePerLbs: 20,
        baleWeightLbs: 2,
      },
      { ratePerKgs: 0, baleWeightKgs: 0 },
      {},
      null,
    ];
    expect(sumItemsPrice(data)).toBe(20);
  });

  it("handles non-integer and float values", () => {
    const data = [{ ratePerKgs: 12.5, baleWeightKgs: 4.8, noOfBales: 1.5, ratePerBale: 2000 }];
    expect(sumItemsPrice(data)).toBeCloseTo(60);
  });
});
