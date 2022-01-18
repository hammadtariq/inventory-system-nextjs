import useSWR from "swr";
import { get, post, put, remove } from "@/lib/http-client";

export const useItems = () => {
  const { data, error, mutate } = useSWR("/api/items", get);

  return {
    items: data?.rows,
    isLoading: !error && !data,
    error,
    mutate,
  };
};

export const useItem = (id) => {
  const { data, error } = useSWR(`/api/items/${id}`, get);

  return {
    item: data,
    isLoading: !error && !data,
    error,
  };
};
export const useItemsByCompanyIdAndType = (companyId, type) => {
  const { data, error } = useSWR(`/api/items?type=${type}&companyId=${companyId}`, get);

  return {
    items: data?.rows,
    isLoading: !error && !data,
    error,
  };
};

export const createItem = async (data) => post("/api/items", data);

export const updateItem = async (id, data) => put(`/api/items/${id}`, data);

export const deleteItem = async (id) => remove(`/api/items/${id}`);
