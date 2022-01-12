import useSWR from "swr";
import { get } from "@/lib/http-client";

export const useItemsByCompanyIdAndType = (companyId, type) => {
  const { data, error } = useSWR(`/api/items?type=${JSON.stringify(type)}&companyId=${JSON.stringify(companyId)}`, get);

  return {
    items: data?.rows,
    isLoading: !error && !data,
    error,
  };
};
