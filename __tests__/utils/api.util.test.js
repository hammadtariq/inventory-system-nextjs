import { calculateAmount } from "@/utils/api.util";

describe("calculateAmount", () => {
  it("multiplies per-kg rate by total baleWeightKgs on hand (not by bale count)", () => {
    const item = { onHand: 5, ratePerKgs: 100, baleWeightKgs: 10 };
    expect(calculateAmount(0, item)).toBe(100 * 10);
  });

  it("multiplies per-lb rate by total baleWeightLbs on hand (not by bale count)", () => {
    const item = { onHand: 3, ratePerLbs: 50, baleWeightLbs: 20 };
    expect(calculateAmount(0, item)).toBe(50 * 20);
  });

  it("multiplies per-bale rate by onHand", () => {
    const item = { onHand: 4, ratePerBale: 200 };
    expect(calculateAmount(0, item)).toBe(4 * 200);
  });

  it("accumulates onto an existing totalAmount", () => {
    const item = { onHand: 2, ratePerKgs: 10, baleWeightKgs: 5 };
    expect(calculateAmount(100, item)).toBe(100 + 10 * 5);
  });

  it("contributes nothing for a sold-out bale-priced item, ignoring stale lifetime noOfBales", () => {
    const soldOutItem = { onHand: 0, noOfBales: 50, ratePerBale: 100, ratePerKgs: null, baleWeightKgs: null };
    expect(calculateAmount(0, soldOutItem)).toBe(0);
  });

  it("contributes nothing for a sold-out Kgs-priced item with residual zero weight", () => {
    const soldOutItem = { onHand: 0, ratePerKgs: 100, baleWeightKgs: 0 };
    expect(calculateAmount(0, soldOutItem)).toBe(0);
  });

  it("treats a raw line item (no onHand field) using noOfBales for per-bale rate", () => {
    const lineItem = { noOfBales: 4, ratePerBale: 200 };
    expect(calculateAmount(0, lineItem)).toBe(4 * 200);
  });

  it("treats a raw line item (no onHand field) using total weight for per-kg rate", () => {
    const lineItem = { noOfBales: 10, ratePerKgs: 2, baleWeightKgs: 500 };
    expect(calculateAmount(0, lineItem)).toBe(2 * 500);
  });
});
