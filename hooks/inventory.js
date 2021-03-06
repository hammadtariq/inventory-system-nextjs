import useSWR from "swr";
import { get } from "@/lib/http-client";

export const useInventory = () => {
  const { data, error } = useSWR("/api/inventory", get);

  return {
    inventory: data,
    isLoading: !error && !data,
    error,
  };
};
