import useSWR from "swr";
import { get } from "@/lib/http-client";

export const getReport = () => get("/api/report");
