import { useState } from "react";
import useSWR from "swr";
import { get, post, put } from "@/lib/http-client";

export const usePurchaseOrders = () => {
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const { data, error, mutate } = useSWR(`/api/purchase?limit=${limit}&offset=${offset}`, get);

  return {
    purchaseOrders: data,
    isLoading: !error && !data,
    error,
    limit,
    offset,
    setLimit,
    setOffset,
    mutate,
  };
};

export const createPurchaseOrder = async (data) => post("/api/purchase", data);

export const approvePurchase = async (id) => put(`/api/purchase/${id}`);

export const cancelPurchase = async (id) => put(`/api/purchase/cancel/${id}`);
