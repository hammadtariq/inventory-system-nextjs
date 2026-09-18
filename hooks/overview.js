import { get } from "@/lib/http-client";

// Legacy — kept for backwards compatibility
export const graphTablesCount = () => get(`/api/overview/count`);
export const graphPurchaseTable = () => get(`/api/overview/purchase`);
export const graphSaleTable = () => get(`/api/overview/sales`);

// Dashboard
export const getAvailableYears = () => get(`/api/overview/available-years`);
export const getDashboardCards = (year) => get(`/api/overview/cards?year=${year}`);
export const getSalesVsPurchases = (year) => get(`/api/overview/sales-vs-purchases?year=${year}`);
export const getSalesDistribution = (year) => get(`/api/overview/sales-distribution?year=${year}`);
export const getPurchaseDistribution = (year) => get(`/api/overview/purchase-distribution?year=${year}`);
export const getTopProducts = (year) => get(`/api/overview/top-products?year=${year}`);
export const getTopCustomers = (year) => get(`/api/overview/top-customers?year=${year}`);
export const getCompanyComparison = (year) => get(`/api/overview/company-comparison?year=${year}`);
