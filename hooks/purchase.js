import useSWR from "swr";
import { get, post, put } from "@/lib/http-client";

export const usePurchaseOrders = () => {
  const { data, error, mutate } = useSWR("/api/purchase", get);

  return {
    purchaseOrders: data,
    isLoading: !error && !data,
    error,
    mutate,
  };
};

export const createPurchaseOrder = async (data) => post("/api/purchase", data);

export const approvePurchase = async (id) => put(`/api/purchase/${id}`);

export const cancelPurchase = async (id) => put(`/api/purchase/cancel/${id}`);
