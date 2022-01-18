import { useCallback, useState } from "react";
import useSWR from "swr";
import { get, post, put } from "@/lib/http-client";
import { DEFAULT_PAGE_LIMIT } from "@/utils/ui.util";

export const usePurchaseOrders = () => {
  const [_limit, setLimit] = useState(DEFAULT_PAGE_LIMIT);
  const [_offset, setOffset] = useState(0);
  const { data, error, mutate } = useSWR(`/api/purchase?limit=${_limit}&offset=${_offset}`, get);

  const paginationHandler = useCallback((limit, offset) => {
    setLimit(limit);
    setOffset(offset);
  }, []);

  return {
    purchaseOrders: data,
    isLoading: !error && !data,
    error,
    paginationHandler,
    mutate,
  };
};

export const createPurchaseOrder = async (data) => post("/api/purchase", data);

export const approvePurchase = async (id) => put(`/api/purchase/${id}`);

export const cancelPurchase = async (id) => put(`/api/purchase/cancel/${id}`);
