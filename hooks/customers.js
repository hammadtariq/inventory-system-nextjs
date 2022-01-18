import { useCallback, useState } from "react";
import useSWR from "swr";
import { get, post, put, remove } from "../lib/http-client";
import { DEFAULT_PAGE_LIMIT } from "@/utils/ui.util";

export const useCustomers = () => {
  const [_limit, setLimit] = useState(DEFAULT_PAGE_LIMIT);
  const [_offset, setOffset] = useState(0);
  const { data, error, mutate } = useSWR(`/api/customer?limit=${_limit}&offset=${_offset}`, get);

  const paginationHandler = useCallback((limit, offset) => {
    setLimit(limit);
    setOffset(offset);
  }, []);

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

export const createCustomer = async (data) => post("/api/customer", data);

export const updateCustomer = async (id, data) => put(`/api/customer/${id}`, data);

export const deleteCustomer = async (id) => remove(`/api/customer/${id}`);
