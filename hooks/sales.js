import useSWR from "swr";
import { get } from "@/lib/http-client";

export const useSales = () => {
  const { data, error } = useSWR("/api/sales", get);

  return {
    sales: data,
    isLoading: !error && !data,
    error,
  };
};
