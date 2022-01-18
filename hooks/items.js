import { useCallback, useState } from "react";
import useSWR from "swr";
import { get, post, put, remove } from "@/lib/http-client";
import { DEFAULT_PAGE_LIMIT } from "@/utils/ui.util";

export const useItems = () => {
  const [_limit, setLimit] = useState(DEFAULT_PAGE_LIMIT);
  const [_offset, setOffset] = useState(0);
  const { data, error, mutate } = useSWR(`/api/items?limit=${_limit}&offset=${_offset}`, get);

  const paginationHandler = useCallback((limit, offset) => {
    setLimit(limit);
    setOffset(offset);
  }, []);

  return {
    items: data?.rows,
    isLoading: !error && !data,
    error,
    paginationHandler,
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
