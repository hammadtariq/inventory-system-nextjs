import useSWR from "swr";
import { useCallback, useState } from "react";

import { get, put } from "../lib/http-client";
import { DEFAULT_PAGE_LIMIT } from "@/utils/ui.util";

export const useCheques = () => {
  const [pagination, setPagination] = useState({ limit: DEFAULT_PAGE_LIMIT, offset: 0 });

  const { data, error, mutate } = useSWR(`/api/cheques?limit=${pagination.limit}&offset=${pagination.offset}`, get);

  const paginationHandler = useCallback(
    (limit, offset) => {
      setPagination({ limit, offset });
    },
    [setPagination]
  );

  return {
    cheques: data,
    isLoading: !error && !data,
    error,
    paginationHandler,
    mutate,
  };
};

export const updateCheques = async (data) => put("/api/cheques", data);
