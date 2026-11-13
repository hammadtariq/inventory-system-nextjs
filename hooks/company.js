import { useCallback, useState } from "react";
import useSWR from "swr";
import { get, post, put, remove } from "@/lib/http-client";
import { DEFAULT_PAGE_LIMIT } from "@/utils/ui.util";

export const useCompanies = (search = "") => {
  const [pagination, setPagination] = useState({ limit: DEFAULT_PAGE_LIMIT, offset: 0, pageNumber: 1 });
  const { data, error, mutate } = useSWR(
    `/api/company?limit=${pagination.limit}&offset=${pagination.offset}&search=${encodeURIComponent(search)}`,
    get,
    // Keep the table mounted while a search loads, so the column filter keeps its state.
    { keepPreviousData: true }
  );

  const paginationHandler = useCallback(
    (limit, offset, pageNumber) => {
      setPagination({ limit, offset, pageNumber });
    },
    [setPagination]
  );

  return {
    companies: data,
    isLoading: !error && !data,
    error,
    pagination,
    paginationHandler,
    mutate,
  };
};

export const useCompany = (id) => {
  const { data, error } = useSWR(id ? `/api/company/${id}` : null, get);

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
