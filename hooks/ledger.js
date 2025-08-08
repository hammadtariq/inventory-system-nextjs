import useSWR from "swr";
import { get, post } from "@/lib/http-client";
import { useState } from "react";

export const useLedger = (type, search = "") => {
  const query = new URLSearchParams({ type, search }).toString();
  const { data, error } = useSWR(`/api/ledger?${query}`, get);

  return {
    ...data,
    isLoading: !error && !data,
    error,
  };
};

export const useLedgerDetails = (id, type) => {
  const { data, error } = useSWR(`/api/ledger/${id}?type=${type}`, get);

  return {
    ...data,
    isLoading: !error && !data,
    error,
  };
};

export const createPayment = async (data) => post("/api/ledger/createPayment", data); // FOR PAYMENT CREATION

export const useLedgerCustomerDetails = () => {
  const [exportLoading, setExportLoading] = useState(false);
  const [errors, setErrors] = useState(null);
  const [totalAmount, setTotalAmount] = useState(null);

  const download = async (id, type, fileType) => {
    setExportLoading(true);
    setErrors(null);

    try {
      const response = await fetch(`/api/ledger/exportCustomer?id=${id}&type=${type}&fileType=${fileType}`, {
        method: "GET",
      });

      if (!response.ok) throw new Error(await response.text());

      setTotalAmount(response.headers.get("X-Total-Amount"));

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `customer-ledger.${fileType}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Ledger export error:", err);
      setErrors(err.message || "Failed to export ledger");
    } finally {
      setExportLoading(false);
    }
  };

  return { download, exportLoading, errors, totalAmount };
};
