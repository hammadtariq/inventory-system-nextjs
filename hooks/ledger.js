import useSWR from "swr";
import { get, post } from "@/lib/http-client";

export const useLedger = (type) => {
  const { data, error } = useSWR(`/api/ledger?type=${type}`, get);

  return {
    ...data,
    isLoading: !error && !data,
    error,
  };
};

export const useLedgerDetails = (id, type) => {
  const { data, error } = useSWR(`/api/ledger/${id}?type=${type}`, get);

  return {
    ...data,
    isLoading: !error && !data,
    error,
  };
};

export const createPayment = async (data) => post("/api/ledger/createPayment", data); // FOR PAYMENT CREATION
