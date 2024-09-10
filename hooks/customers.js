import { useCallback, useState } from "react";

import useSWR from "swr";

import { DEFAULT_PAGE_LIMIT } from "@/utils/ui.util";

import { get, post, put, remove } from "../lib/http-client";

export const useCustomers = () => {
  const [pagination, setPagination] = useState({ limit: DEFAULT_PAGE_LIMIT, offset: 0 });
  const { data, error, mutate } = useSWR(`/api/customer?limit=${pagination.limit}&offset=${pagination.offset}`, get);

  const paginationHandler = useCallback(
    (limit, offset) => {
      setPagination({ limit, offset });
    },
    [setPagination]
  );

  return {
    customers: data,
    isLoading: !error && !data,
    error,
    paginationHandler,
    mutate,
  };
};

export const useCustomer = (id) => {
  const { data, error } = useSWR(`/api/customer/${id}`, get);

  return {
    customer: data,
    isLoading: !error && !data,
    error,
  };
};

export const useCustomerAttributes = (attr = [], type = true) => {
  const { data, error } = useSWR(type ? `/api/customer?attributes=${JSON.stringify(attr)}` : null, get);

  return {
    customers: data?.rows,
    isLoading: !error && !data,
    error,
  };
};

export const createCustomer = async (data) => post("/api/customer", data);

export const updateCustomer = async (id, data) => put(`/api/customer/${id}`, data);

export const deleteCustomer = async (id) => remove(`/api/customer/${id}`);
