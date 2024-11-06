import useSWR from "swr";
import { get } from "@/lib/http-client";

export const useExportFile = (fileDetails) => {
  const constructUrl = () => {
    if (!fileDetails?.fileName || !fileDetails?.fileExtension) return null;

    const queryParams = new URLSearchParams({
      invoiceNumber: fileDetails.invoiceNumber,
      companyId: fileDetails.companyId,
      type: fileDetails.type,
      id: fileDetails.id,
      filters: fileDetails.filters ? JSON.stringify(fileDetails.filters) : undefined,
    });
    return `/api/${fileDetails.fileName}/export?fileExtension=${fileDetails.fileExtension}&${queryParams}`;
  };

  const fetcher = async (url) => {
    const response = await get(url, { responseType: "blob" });
    if (!(response instanceof Blob)) {
      throw new Error("Expected a Blob response");
    }
    return response;
  };

  const {
    data: fileBlob,
    error,
    isValidating: isLoading,
  } = useSWR(constructUrl(), fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  return { fileBlob, isLoading, isError: error };
};
