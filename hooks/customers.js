import useSWR from "swr";
import { getFetcher, post, put, remove } from "../lib/httpClient";

export const useGetCustomers = () => {
  const { data, error, mutate } = useSWR("/api/customer", getFetcher);

  return {
    customers: data,
    isLoading: !error && !data,
    error,
    mutate,
  };
};

export const useGetCustomer = (id) => {
  const { data, error } = useSWR(`/api/customer/${id}`, getFetcher);

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
