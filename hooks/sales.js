import { useCallback, useState } from "react";
import useSWR from "swr";
import { get, put } from "@/lib/http-client";
import { DEFAULT_PAGE_LIMIT } from "@/utils/ui.util";

export const useSales = () => {
  const [pagination, setPagination] = useState({ limit: DEFAULT_PAGE_LIMIT, offset: 0 });
  const { data, error, mutate } = useSWR(`/api/sales?limit=${pagination.limit}&offset=${pagination.offset}`, get);

  const paginationHandler = useCallback(
    (limit, offset) => {
      setPagination({ limit, offset });
    },
    [setPagination]
  );

  return {
    sales: data,
    isLoading: !error && !data,
    error,
    paginationHandler,
    mutate,
  };
};

export const approveSale = async (id) => put(`/api/sales/${id}`);

export const cancelSale = async (id) => put(`/api/sales/cancel/${id}`);
