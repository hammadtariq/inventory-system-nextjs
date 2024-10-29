import { useCallback, useState } from "react";
import useSWR from "swr";
import { get, post, put, remove } from "@/lib/http-client";
import { DEFAULT_PAGE_LIMIT } from "@/utils/ui.util";

export const useCompanies = () => {
  const [pagination, setPagination] = useState({ limit: DEFAULT_PAGE_LIMIT, offset: 0 });
  const { data, error, mutate } = useSWR(`/api/company?limit=${pagination.limit}&offset=${pagination.offset}`, get);

  const paginationHandler = useCallback(
    (limit, offset) => {
      setPagination({ limit, offset });
    },
    [setPagination]
  );

  return {
    companies: data,
    isLoading: !error && !data,
    error,
    paginationHandler,
    mutate,
  };
};

export const useCompany = (id) => {
  const { data, error } = useSWR(`/api/company/${id}`, get);

  return {
    company: data,
    isLoading: !error && !data,
    error,
  };
};

export const useCompanyAttributes = (attr = []) => {
  const { data, error } = useSWR(`/api/company?attributes=${JSON.stringify(attr)}`, get);

  return {
    company: data?.rows,
    isLoading: !error && !data,
    error,
  };
};

export const createCompany = async (data) => post("/api/company", data);

export const searchCompany = async (data) => get(`/api/company/search?value=${data}`);

export const updateCompany = async (id, data) => put(`/api/company/${id}`, data);

export const deleteCompany = async (id) => remove(`/api/company/${id}`);
