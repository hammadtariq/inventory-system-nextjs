import useSWR from "swr";
import { get } from "@/lib/http-client";

// Custom SWR hook for exporting files
export const useExportFile = (fileDetails) => {
  // Fetcher function
  const fetcher = async (url) => {
    const response = await get(url, { responseType: "blob" });
    if (response instanceof Blob) {
      return response;
    } else {
      throw new Error("Expected a Blob response");
    }
  };

  // Construct the URL for fetching the file
  const constructUrl = () => {
    if (!fileDetails || !fileDetails.fileName || !fileDetails.fileExtension) return null;

    const { fileName, fileExtension, invoiceNumber, companyId, type, id } = fileDetails;
    const baseUrl = `/api/${fileName}/export?fileExtension=${fileExtension}`;
    const queryParams = new URLSearchParams();

    if (invoiceNumber) queryParams.append("invoiceNumber", invoiceNumber);
    if (companyId) queryParams.append("companyId", companyId);
    if (type) queryParams.append("type", type);
    if (id) queryParams.append("id", id);

    return queryParams.toString() ? `${baseUrl}&${queryParams.toString()}` : baseUrl;
  };

  // Use SWR hook with a conditional key
  const url = constructUrl();
  const { data, error, isValidating } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  return {
    fileBlob: data,
    isLoading: isValidating,
    isError: error,
  };
};
