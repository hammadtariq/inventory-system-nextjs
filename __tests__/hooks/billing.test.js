jest.mock("react", () => ({
  useCallback: (callback) => callback,
  useState: (initialValue) => [initialValue, jest.fn()],
}));

jest.mock("swr", () => jest.fn(() => ({ data: null, error: null, mutate: jest.fn() })));

jest.mock("@/lib/http-client", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
}));

import useSWR from "swr";

import { put } from "@/lib/http-client";
import { reviewPaymentRequest, usePaymentRequests } from "@/hooks/billing";

describe("billing hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not fetch tenant payment requests when disabled", () => {
    usePaymentRequests("PENDING", false);

    expect(useSWR).toHaveBeenCalledWith(null, expect.any(Function));
  });

  it("fetches payment requests from the public payment request API", () => {
    usePaymentRequests("PENDING");

    expect(useSWR).toHaveBeenCalledWith(
      "/api/admin/public-payment-requests?limit=50&offset=0&status=PENDING",
      expect.any(Function)
    );
  });

  it("reviews payment requests through the public payment request API", async () => {
    await reviewPaymentRequest(12, { status: "APPROVED" });

    expect(put).toHaveBeenCalledWith("/api/admin/public-payment-requests/12", { status: "APPROVED" });
  });
});
