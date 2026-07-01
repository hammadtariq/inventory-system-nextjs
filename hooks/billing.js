import { useCallback, useState } from "react";

import useSWR from "swr";

import { DEFAULT_PAGE_LIMIT } from "@/utils/ui.util";

import { get, post, put } from "../lib/http-client";

export const useBillingPlans = () => {
  const { data, error, mutate } = useSWR("/api/billing/plans", get);

  return {
    plans: data?.rows || [],
    isLoading: !error && !data,
    error,
    mutate,
  };
};

export const useBillingSummary = () => {
  const { data, error, mutate } = useSWR("/api/billing/subscription", get);

  return {
    subscription: data?.subscription,
    invoices: data?.invoices || [],
    isLoading: !error && !data,
    error,
    mutate,
  };
};

export const usePaymentRequests = (status, enabled = true) => {
  const [pagination, setPagination] = useState({ limit: DEFAULT_PAGE_LIMIT, offset: 0 });
  const queryStatus = status ? `&status=${status}` : "";
  const { data, error, mutate } = useSWR(
    enabled ? `/api/admin/payments?limit=${pagination.limit}&offset=${pagination.offset}${queryStatus}` : null,
    get
  );

  const paginationHandler = useCallback(
    (limit, offset) => {
      setPagination({ limit, offset });
    },
    [setPagination]
  );

  return {
    requests: data,
    isLoading: !error && !data,
    error,
    mutate,
    paginationHandler,
  };
};

export const usePublicPaymentRequests = (status, enabled = true) => {
  const [pagination, setPagination] = useState({ limit: DEFAULT_PAGE_LIMIT, offset: 0 });
  const queryStatus = status ? `&status=${status}` : "";
  const { data, error, mutate } = useSWR(
    enabled
      ? `/api/admin/public-payment-requests?limit=${pagination.limit}&offset=${pagination.offset}${queryStatus}`
      : null,
    get
  );

  const paginationHandler = useCallback(
    (limit, offset) => {
      setPagination({ limit, offset });
    },
    [setPagination]
  );

  return {
    requests: data,
    isLoading: !error && !data,
    error,
    mutate,
    paginationHandler,
  };
};

export const createInvoice = async (data) => post("/api/billing/invoices", data);

export const submitPaymentProof = async (invoiceId, data) => post(`/api/billing/invoices/${invoiceId}/proof`, data);

export const reviewPaymentRequest = async (proofId, data) => put(`/api/admin/payments/${proofId}`, data);

export const reviewPublicPaymentRequest = async (requestId, data) =>
  put(`/api/admin/public-payment-requests/${requestId}`, data);
