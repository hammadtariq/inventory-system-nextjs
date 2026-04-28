import { useCallback, useState } from "react";
import useSWR from "swr";
import { get, post } from "@/lib/http-client";
import { DEFAULT_PAGE_LIMIT } from "@/utils/ui.util";

export const useSaleReturns = () => {
  const [pagination, setPagination] = useState({ limit: DEFAULT_PAGE_LIMIT, offset: 0 });
  const { data, error, mutate } = useSWR(
    `/api/sales/returns?limit=${pagination.limit}&offset=${pagination.offset}`,
    get
  );

  const paginationHandler = useCallback(
    (limit, offset) => {
      setPagination({ limit, offset });
    },
    [setPagination]
  );

  return {
    saleReturns: data,
    isLoading: !error && !data,
    error,
    paginationHandler,
    mutate,
  };
};

export const useReturnableSale = (saleId) => {
  const { data, error, mutate } = useSWR(saleId ? `/api/sales/returns/${saleId}` : null, get);

  return {
    returnableSale: data,
    isLoading: !!(saleId && !error && !data),
    error,
    mutate,
  };
};

export const getReturnableSale = (saleId) => get(`/api/sales/returns/${saleId}`);

export const createSaleReturn = (data) => post("/api/sales/returns", data);
