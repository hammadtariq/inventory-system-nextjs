import useSWR from "swr";
import { get } from "@/lib/http-client";

export const useInventory = () => {
  const { data, error, mutate } = useSWR("/api/inventory", get);

  return {
    inventory: data,
    isLoading: !error && !data,
    error,
    mutate,
  };
};

export const searchInventory = (value) => get(`/api/inventory/search?value=${value}`);

export const getInventory = (id) => get(`/api/inventory/${id}`);
