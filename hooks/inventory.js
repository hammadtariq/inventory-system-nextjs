import { useCallback, useState } from "react";

import useSWR from "swr";

import { get } from "@/lib/http-client";
import { DEFAULT_PAGE_LIMIT } from "@/utils/ui.util";

export const useInventory = () => {
  const [pagination, setPagination] = useState({ limit: DEFAULT_PAGE_LIMIT, offset: 0 });
  const { data, error, mutate } = useSWR(`/api/inventory?limit=${pagination.limit}&offset=${pagination.offset}`, get);

  const paginationHandler = useCallback(
    (limit, offset) => {
      setPagination({ limit, offset });
    },
    [setPagination]
  );

  return {
    inventory: data,
    isLoading: !error && !data,
    error,
    mutate,
    paginationHandler,
  };
};

export const useInventoryAttributes = (attr = []) => {
  const { data, error } = useSWR(`/api/inventory?attributes=${JSON.stringify(attr)}`, get);

  return {
    inventory: data?.rows,
    isLoading: !error && !data,
    error,
  };
};

export const useInventoryByCompanyId = (companyId) => {
  const { data, error } = useSWR(`/api/inventory/byCompanyId/${companyId}`, get);

  return {
    inventory: data?.rows,
    isLoading: !error && !data,
    error,
  };
};

export const searchInventory = (value) => get(`/api/inventory/search?value=${value}`);

export const getInventory = (id) => get(`/api/inventory/${id}`);
