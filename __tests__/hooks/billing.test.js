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

import { usePaymentRequests } from "@/hooks/billing";

describe("billing hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not fetch tenant payment requests when disabled", () => {
    usePaymentRequests("PENDING", false);

    expect(useSWR).toHaveBeenCalledWith(null, expect.any(Function));
  });
});
