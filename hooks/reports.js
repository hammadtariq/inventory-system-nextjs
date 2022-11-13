import useSWR from "swr";
import { get } from "@/lib/http-client";

export const getReport = (companyId) => get(`/api/report?companyId=${companyId}`);
