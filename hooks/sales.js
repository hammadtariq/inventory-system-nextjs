import { useCallback, useState } from "react";
import useSWR from "swr";
import { get, post, put } from "@/lib/http-client";
import { DEFAULT_PAGE_LIMIT } from "@/utils/ui.util";

export const useSales = () => {
  const [pagination, setPagination] = useState({ limit: DEFAULT_PAGE_LIMIT, offset: 0 });
  const { data, error, mutate } = useSWR(`/api/sales?limit=${pagination.limit}&offset=${pagination.offset}`, get);

  const paginationHandler = useCallback(
    (limit, offset) => {
      setPagination({ limit, offset });
    },
    [setPagination]
  );

  return {
    sales: data,
    isLoading: !error && !data,
    error,
    paginationHandler,
    mutate,
  };
};

export const useSale = (id, type) => {
  const { data, error } = useSWR(`/api/sales/${id}?type=${type}`, get);

  return {
    sale: data,
    isLoading: !error && !data,
    error,
  };
};

export const searchSales = (value) => get(`/api/sales/search?value=${value}`);

export const getSales = (id) => get(`/api/sales/${id}?type=${type}`);

export const getAllSalesbyCustomer = (id) => get(`/api/sales/byCustomerId/${id}`);

export const getAllSalesForReport = async ({ customer, company, item, dateRangeStart, dateRangeEnd }) => {
  const params = new URLSearchParams({
    ...(customer && { customerId: customer }),
    ...(company && { companyId: company }),
    ...(item && { itemName: item }),
    ...(dateRangeStart && { dateRangeStart }),
    ...(dateRangeEnd && { dateRangeEnd }),
  });
  return await get(`/api/sales/report/search?${params.toString()}`);
};

export const createSale = async (data) => post("/api/sales", data);

export const updateSale = async (id, data) => put(`/api/sales/${id}`, data);

export const approveSale = async (id) => put(`/api/sales/approve/${id}`);

export const cancelSale = async (id) => put(`/api/sales/cancel/${id}`);
