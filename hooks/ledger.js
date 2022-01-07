import useSWR from "swr";
import { get, post } from "@/lib/http-client";

export const useLedger = () => {
  const { data, error } = useSWR("/api/ledger", get);

  return {
    transactionHistory: data,
    isLoading: !error && !data,
    error,
  };
};

export const useLedgerDetails = (id) => {
  const { data, error } = useSWR(`/api/ledger/${id}`, get);

  return {
    data,
    isLoading: !error && !data,
    error,
  };
};

export const createTransaction = async (data) => post("/api/ledger", data);
