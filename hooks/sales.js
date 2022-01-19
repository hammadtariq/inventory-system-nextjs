import { useCallback, useState } from "react";
import useSWR from "swr";
import { get } from "@/lib/http-client";
import { DEFAULT_PAGE_LIMIT } from "@/utils/ui.util";

export const useSales = () => {
  const [pagination, setPagination] = useState({ limit: DEFAULT_PAGE_LIMIT, offset: 0 });
  const { data, error } = useSWR(`/api/sales?limit=${pagination.limit}&offset=${pagination.offset}`, get);

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
  };
};
