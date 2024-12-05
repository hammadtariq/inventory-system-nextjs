import { useState } from "react";
import useSWR from "swr";
import { get, post, put } from "@/lib/http-client";
import { DEFAULT_PAGE_LIMIT } from "@/utils/ui.util";

export const usePurchaseOrders = (search) => {
  const [pagination, setPagination] = useState({ limit: DEFAULT_PAGE_LIMIT, offset: 0, pageNumber: 1 });
  const { data, error, mutate } = useSWR(
    `/api/purchase?limit=${pagination.limit}&offset=${pagination.offset}&search=${search}`,
    get
  );

  const paginationHandler = (limit, offset, pageNumber) => {
    setPagination({ limit, offset, pageNumber });
  };

  return {
    purchaseOrders: data,
    isLoading: !error && !data,
    error,
    pagination,
    paginationHandler,
    mutate,
  };
};

export const usePurchaseOrder = (id) => {
  const { data, error } = useSWR(`/api/purchase/${id}`, get);

  return {
    purchase: data,
    isLoading: !error && !data,
    error,
  };
};
export const searchPurchase = (value) => get(`/api/purchase/search?value=${value}`);

export const getPurchase = (id) => get(`/api/purchase/${id}`);

export const getAllPurchasesbyCompany = (id) => get(`/api/purchase/byCompanyId/${id}`);

export const createPurchaseOrder = async (data) => post("/api/purchase", data);

export const approvePurchase = async (id) => put(`/api/purchase/approve/${id}`);

export const cancelPurchase = async (id) => put(`/api/purchase/cancel/${id}`);

export const updatePurchaseOrder = async (id, data) => put(`/api/purchase/${id}`, data);
