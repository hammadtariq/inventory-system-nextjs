import { get, post } from "@/lib/http-client";

export const getReturnableSale = (saleId) => get(`/api/sales/returns/${saleId}`);

export const createSaleReturn = (data) => post("/api/sales/returns", data);
