import { get } from "@/lib/http-client";

export const graphTablesCount = () => get(`/api/overview/count`);

export const graphPurchaseTable = () => get(`/api/overview/purchase`);

export const graphSaleTable = () => get(`/api/overview/sales`);
