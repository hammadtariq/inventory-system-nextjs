import { useState } from "react";
import useSWR from "swr";
import { get, post, put, remove } from "../lib/http-client";

export const useCustomers = () => {
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const { data, error, mutate } = useSWR(`/api/customer?limit=${limit}&offset=${offset}`, get);

  return {
    customers: data,
    isLoading: !error && !data,
    error,
    limit,
    offset,
    setLimit,
    setOffset,
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
