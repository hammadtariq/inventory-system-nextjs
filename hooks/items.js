import { useCallback, useState } from "react";

import useSWR from "swr";

import { get, post, put, remove } from "@/lib/http-client";
import { DEFAULT_PAGE_LIMIT } from "@/utils/ui.util";

export const useItems = () => {
  const [pagination, setPagination] = useState({ limit: DEFAULT_PAGE_LIMIT, offset: 0 });
  const { data, error, mutate } = useSWR(`/api/items?limit=${pagination.limit}&offset=${pagination.offset}`, get);

  const paginationHandler = useCallback(
    (limit, offset) => {
      setPagination({ limit, offset });
    },
    [setPagination]
  );

  return {
    items: data?.rows,
    count: data?.count,
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
export const useItemsByCompanyIdAndType = (companyId, type, isEdit = false) => {
  const { data, error } = useSWR(
    isEdit
      ? null
      : `/api/items?limit=${1000}&offset=${0}&type=${type}&companyId=${companyId}&orderBy=itemName&sortOrder=ASC`,
    get
  );

  return {
    items: data?.rows,
    isLoading: !error && !data && !isEdit,
    error,
  };
};

export const createItem = async (data) => post("/api/items", data);

export const updateItem = async (id, data) => put(`/api/items/${id}`, data);

export const deleteItem = async (id) => remove(`/api/items/${id}`);
