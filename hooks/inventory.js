import { useState } from "react";
import useSWR from "swr";
import { get } from "@/lib/http-client";

export const useInventory = () => {
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const { data, error } = useSWR(`/api/inventory?limit=${limit}&offset=${offset}`, get);

  return {
    inventory: data,
    isLoading: !error && !data,
    error,
    limit,
    offset,
    setLimit,
    setOffset,
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
