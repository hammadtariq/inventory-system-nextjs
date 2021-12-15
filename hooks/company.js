import useSWR from "swr";
import { getFetcher, deleteFetcher } from "../lib/httpClient";

export const useCompanies = () => {
  const { data, error } = useSWR("/api/company", getFetcher);

  return {
    companies: data,
    isLoading: !error && !data,
    error,
  };
};
