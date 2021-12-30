import useSWR from "swr";
import { get } from "@/lib/http-client";

export const usePurchaseOrders = () => {
  const { data, error } = useSWR("/api/purchase", get);

  return {
    purchaseOrders: data,
    isLoading: !error && !data,
    error,
  };
};
