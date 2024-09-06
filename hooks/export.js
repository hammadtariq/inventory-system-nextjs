import { get } from "@/lib/http-client";

export const exportFile = async (fileName, fileExtension, id, type, invoiceNumber, companyId) => {
  try {
    // Construct the URL with query parameters
    let baseUrl = `/api/${fileName}/export?fileExtension=${fileExtension}`;
    // Append only existing parameters
    const queryParams = new URLSearchParams();
    if (invoiceNumber) queryParams.append("invoiceNumber", invoiceNumber);
    if (companyId) queryParams.append("companyId", companyId);
    if (type) queryParams.append("type", type);
    if (id) queryParams.append("id", id);
    // Add query parameters to the URL if they exist
    if (queryParams.toString()) {
      baseUrl += `&${queryParams.toString()}`;
    }

    // Make the API request with responseType as 'blob'
    const response = await get(baseUrl, { responseType: "blob" });

    // Check if the response is a valid Blob
    if (response instanceof Blob) {
      return response;
    } else {
      throw new Error("Expected a Blob response");
    }
  } catch (error) {
    console.error("Error in exportFile:", error);
    throw error;
  }
};
