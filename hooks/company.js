import useSWR from "swr";
import { axiosFetcher } from "../utils/axios";

export const useCompanies = () => {
  const response = useSWR("/api/company", axiosFetcher);
  return response;
};
