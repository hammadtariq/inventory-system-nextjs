import { calculateDifferences } from "@/utils/calculateDifferences.util";

describe("calculateDifferences (realistic structure)", () => {
  it("should detect changes in scalar fields like totalAmount, invoiceNumber", () => {
    const oldData = {
      totalAmount: 1000,
      invoiceNumber: "INV-001",
    };
    const newData = {
      totalAmount: 1100,
      invoiceNumber: "INV-002",
    };
    const diff = calculateDifferences(newData, oldData);
    expect(diff).toEqual({
      totalAmount: 1100,
      invoiceNumber: "INV-002",
    });
  });

  it("should detect differences in nested purchasedProducts array", () => {
    const oldData = {
      purchasedProducts: [
        {
          id: 1,
          itemName: "Cotton",
          noOfBales: 10,
          baleWeightLbs: 200,
          baleWeightKgs: 90,
        },
      ],
    };
    const newData = {
      purchasedProducts: [
        {
          id: 1,
          itemName: "Cotton",
          noOfBales: 12,
          baleWeightLbs: 210,
          baleWeightKgs: 90, // no change here
        },
      ],
    };
    const diff = calculateDifferences(newData, oldData);
    expect(diff).toEqual({
      purchasedProducts: [
        {
          noOfBales: 2,
          baleWeightLbs: 10,
          id: 1,
        },
      ],
    });
  });

  it("should handle adding a new product (oldData missing it)", () => {
    const oldData = {
      purchasedProducts: [],
    };
    const newData = {
      purchasedProducts: [
        {
          id: 1,
          itemName: "New Cotton",
          noOfBales: 8,
          baleWeightLbs: 150,
          baleWeightKgs: 68,
        },
      ],
    };
    const diff = calculateDifferences(newData, oldData);
    expect(diff).toEqual({
      purchasedProducts: [
        {
          itemName: "New Cotton",
          noOfBales: 8,
          baleWeightLbs: 150,
          baleWeightKgs: 68,
          id: 1,
        },
      ],
    });
  });

  it("should handle removed fields (if newData lacks keys)", () => {
    const oldData = {
      totalAmount: 1000,
      invoiceNumber: "INV-123",
    };
    const newData = {
      totalAmount: 1000,
    };
    const diff = calculateDifferences(newData, oldData);
    expect(diff).toEqual({});
  });

  it("should not return anything if no change in purchasedProducts", () => {
    const oldData = {
      purchasedProducts: [
        {
          id: 1,
          noOfBales: 10,
          baleWeightLbs: 200,
        },
      ],
    };
    const newData = {
      purchasedProducts: [
        {
          id: 1,
          noOfBales: 10,
          baleWeightLbs: 200,
        },
      ],
    };
    const diff = calculateDifferences(newData, oldData);
    expect(diff).toEqual({ purchasedProducts: [{ id: 1 }] }); // or skip empty object if you want that in your implementation
  });

  it("should compute multiple differences and revision-eligible fields", () => {
    const oldData = {
      companyId: 1,
      totalAmount: 1000,
      surCharge: 100,
      invoiceNumber: "ABC",
      baleType: "BIG_BALES",
      purchasedProducts: [
        {
          id: 2,
          noOfBales: 20,
          baleWeightLbs: 300,
          ratePerLbs: 1.5,
        },
      ],
    };

    const newData = {
      companyId: 1,
      totalAmount: 1200,
      surCharge: 110,
      invoiceNumber: "XYZ",
      baleType: "SMALL_BALES",
      purchasedProducts: [
        {
          id: 2,
          noOfBales: 25,
          baleWeightLbs: 320,
          ratePerLbs: 1.5,
        },
      ],
    };

    const diff = calculateDifferences(newData, oldData);
    expect(diff).toEqual({
      totalAmount: 1200,
      surCharge: 110,
      invoiceNumber: "XYZ",
      baleType: "SMALL_BALES",
      purchasedProducts: [
        {
          noOfBales: 5,
          baleWeightLbs: 20,
          id: 2,
        },
      ],
    });
  });
});
