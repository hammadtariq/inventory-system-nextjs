import useSWR from "swr";
import { get, post } from "@/lib/http-client";

export const usePurchaseOrders = () => {
  const { data, error } = useSWR("/api/purchase", get);

  return {
    purchaseOrders: data,
    isLoading: !error && !data,
    error,
  };
};

export const createPurchaseOrder = async (data) => post("/api/purchase", data);
