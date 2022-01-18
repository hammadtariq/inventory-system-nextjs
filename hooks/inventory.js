import { useCallback, useState } from "react";
import useSWR from "swr";
import { get } from "@/lib/http-client";
import { DEFAULT_PAGE_LIMIT } from "@/utils/ui.util";

export const useInventory = () => {
  const [_limit, setLimit] = useState(DEFAULT_PAGE_LIMIT);
  const [_offset, setOffset] = useState(0);
  const { data, error } = useSWR(`/api/inventory?limit=${_limit}&offset=${_offset}`, get);

  const paginationHandler = useCallback((limit, offset) => {
    setLimit(limit);
    setOffset(offset);
  }, []);

  return {
    inventory: data,
    isLoading: !error && !data,
    error,
    paginationHandler,
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
