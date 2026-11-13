import { useCallback, useState } from "react";
import useSWR from "swr";
import { get, post, put } from "@/lib/http-client";
import { DEFAULT_PAGE_LIMIT } from "@/utils/ui.util";

export const useSales = ({ field = "", value = "" } = {}) => {
  const [pagination, setPagination] = useState({ limit: DEFAULT_PAGE_LIMIT, offset: 0, pageNumber: 1 });
  const { data, error, mutate } = useSWR(
    `/api/sales?limit=${pagination.limit}&offset=${pagination.offset}` +
      `&search=${encodeURIComponent(value)}&searchField=${encodeURIComponent(field)}`,
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
    sales: data,
    isLoading: !error && !data,
    error,
    pagination,
    paginationHandler,
    mutate,
  };
};

export const useSale = (id, type) => {
  const { data, error } = useSWR(id ? `/api/sales/${id}?type=${type}` : null, get);

  return {
    sale: data,
    isLoading: !id || (!error && !data),
    error,
  };
};

export const searchSales = (value) => get(`/api/sales/search?value=${value}`);

export const getSales = (id) => get(`/api/sales/${id}?type=${type}`);

export const getAllSalesbyCustomer = (id, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return get(`/api/sales/byCustomerId/${id}${query ? `?${query}` : ""}`);
};

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
