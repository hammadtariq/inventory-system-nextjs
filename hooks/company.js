import useSWR from "swr";
import { getFetcher, post, put, remove } from "../lib/httpClient";

export const useCompanies = () => {
  const { data, error, mutate } = useSWR("/api/company", getFetcher);

  return {
    companies: data,
    isLoading: !error && !data,
    error,
    mutate,
  };
};

export const useCompany = (id) => {
  const { data, error } = useSWR(`/api/company/${id}`, getFetcher);

  return {
    company: data,
    isLoading: !error && !data,
    error,
  };
};

export const createCompany = async (data) => {
  await post("/api/company", data);
};

export const updateCompany = async (id, data) => {
  await put(`/api/company/${id}`, data);
};

export const deleteCompany = async (id) => {
  await remove(`/api/company/${id}`);
};
