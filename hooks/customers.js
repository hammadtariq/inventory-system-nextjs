import useSWR from "swr";
import { get, post, put, remove } from "../lib/http-client";

export const useGetCustomers = () => {
  const { data, error, mutate } = useSWR("/api/customer", get);

  return {
    customers: data,
    isLoading: !error && !data,
    error,
    mutate,
  };
};

export const useGetCustomer = (id) => {
  const { data, error } = useSWR(`/api/customer/${id}`, get);

  return {
    customer: data,
    isLoading: !error && !data,
    error,
  };
};

export const createCustomer = async (data) => {
  console.log(data);
  await post("/api/customer", data);
};

export const updateCustomer = async (id, data) => {
  await put(`/api/customer/${id}`, data);
};

export const deleteCustomer = async (id) => {
  await remove(`/api/customer/${id}`);
};
