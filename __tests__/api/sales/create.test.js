import { createSale } from "@/pages/api/sales/index"; // Adjust the import path to your actual file
import db from "@/lib/postgres";
import { STATUS } from "@/utils/api.util";
import { createMocks } from "node-mocks-http"; // Import from node-mocks-http

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  Sale: {
    create: jest.fn(),
  },
}));

describe("createSale API", () => {
  let req, res;

  beforeEach(() => {
    // Create new mock request and response objects before each test
    ({ req, res } = createMocks({
      method: "POST",
    }));
  });

  it("should create a sale order successfully with valid data", async () => {
    req.body = {
      customerId: 123,
      totalAmount: 1000,
      laborCharge: null,
      soldDate: "2025-04-24T00:00:00Z",
      soldProducts: [
        {
          itemName: "Shirt",
          noOfBales: 10,
          baleWeightLbs: 20,
          baleWeightKgs: 9,
          ratePerLbs: 10,
          ratePerKgs: 20,
          ratePerBale: 200,
          companyId: 1,
          id: 101,
        },
      ],
    };

    db.Sale.create.mockResolvedValue(true); // Mocking a successful creation of sale
    db.dbConnect.mockResolvedValue(true); // Mock successful DB connection

    await createSale(req, res);

    // Assert that the response status code is 200 and Sale.create was called with correct data
    expect(res.statusCode).toBe(200);
    expect(db.Sale.create).toHaveBeenCalledWith({
      customerId: 123,
      totalAmount: 1000,
      laborCharge: null,
      soldDate: new Date("2025-04-24T00:00:00.000Z"),
      soldProducts: [
        {
          baleWeightKgs: 9,
          baleWeightLbs: 20,
          companyId: 1,
          id: 101,
          itemName: "shirt",
          noOfBales: 10,
          ratePerBale: 200,
          ratePerKgs: 20,
          ratePerLbs: 10,
        },
      ],
      status: STATUS.PENDING,
    });
  });

  it("should return 400 if the validation fails", async () => {
    req.body = {
      customerId: 123,
      totalAmount: 1000,
      laborCharge: null,
      soldDate: "invalid-date", // Invalid date to trigger validation failure
      soldProducts: [
        {
          itemName: "Shirt",
          noOfBales: 10,
          baleWeightLbs: 20,
          baleWeightKgs: 9,
          ratePerLbs: 10,
          ratePerKgs: 20,
          ratePerBale: 200,
          companyId: 1,
          id: 101,
        },
      ],
    };

    await createSale(req, res);

    // Assert that validation fails and the response status code is 400
    expect(res.statusCode).toBe(400);
    expect(res._getData()).toEqual({ message: 'ValidationError: "soldDate" must be a valid date' });
  });

  it("should return 500 if there is a database error", async () => {
    req.body = {
      customerId: 123,
      totalAmount: 1000,
      laborCharge: null,
      soldDate: "2025-04-24T00:00:00Z",
      soldProducts: [
        {
          itemName: "Shirt",
          noOfBales: 10,
          baleWeightLbs: 20,
          baleWeightKgs: 9,
          ratePerLbs: 10,
          ratePerKgs: 20,
          ratePerBale: 200,
          companyId: 1,
          id: 101,
        },
      ],
    };

    db.Sale.create.mockRejectedValue(new Error("Database error")); // Simulate a DB error
    db.dbConnect.mockResolvedValue(true); // Mock successful DB connection

    await createSale(req, res);

    // Assert that a 500 status code is returned for database error
    expect(res.statusCode).toBe(500);
    expect(res._getData()).toEqual({ message: "Error: Database error" });
  });
});
