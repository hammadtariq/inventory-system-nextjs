import { useCallback, useState } from "react";
import useSWR from "swr";
import { get, post, put } from "@/lib/http-client";
import { DEFAULT_PAGE_LIMIT } from "@/utils/ui.util";

export const usePurchaseOrders = () => {
  const [pagination, setPagination] = useState({ limit: DEFAULT_PAGE_LIMIT, offset: 0 });
  const { data, error, mutate } = useSWR(`/api/purchase?limit=${pagination.limit}&offset=${pagination.offset}`, get);

  const paginationHandler = useCallback(
    (limit, offset) => {
      setPagination({ limit, offset });
    },
    [setPagination]
  );

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
