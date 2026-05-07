import { get } from "@/lib/http-client";

// Legacy — kept for backwards compatibility
export const graphTablesCount = () => get(`/api/overview/count`);
export const graphPurchaseTable = () => get(`/api/overview/purchase`);
export const graphSaleTable = () => get(`/api/overview/sales`);

// Dashboard
export const getDashboardCards = () => get(`/api/overview/cards`);
export const getSalesVsPurchases = () => get(`/api/overview/sales-vs-purchases`);
export const getSalesDistribution = () => get(`/api/overview/sales-distribution`);
export const getPurchaseDistribution = () => get(`/api/overview/purchase-distribution`);
export const getTopProducts = () => get(`/api/overview/top-products`);
export const getTopCustomers = () => get(`/api/overview/top-customers`);
export const getCompanyComparison = () => get(`/api/overview/company-comparison`);
