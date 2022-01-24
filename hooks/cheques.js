import useSWR from "swr";
import { get, put } from "../lib/http-client";

export const useCheques = () => {
  const { data, error, mutate } = useSWR("/api/cheques", get);

  return {
    cheques: data,
    isLoading: !error && !data,
    error,
    mutate,
  };
};

export const updateCheques = async (data) => put("/api/cheques", data);
