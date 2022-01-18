import { useState } from "react";
import useSWR from "swr";
import { get, post, put, remove } from "@/lib/http-client";

export const useCompanies = () => {
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const { data, error, mutate } = useSWR(`/api/company?limit=${limit}&offset=${offset}`, get);

  return {
    companies: data,
    isLoading: !error && !data,
    error,
    limit,
    offset,
    setLimit,
    setOffset,
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

export const updateCompany = async (id, data) => put(`/api/company/${id}`, data);

export const deleteCompany = async (id) => remove(`/api/company/${id}`);
