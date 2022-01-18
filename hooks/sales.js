import { useState } from "react";
import useSWR from "swr";
import { get } from "@/lib/http-client";

export const useSales = () => {
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const { data, error } = useSWR(`/api/sales?limit=${limit}&offset=${offset}`, get);

  return {
    sales: data,
    isLoading: !error && !data,
    error,
    limit,
    offset,
    setLimit,
    setOffset,
  };
};
