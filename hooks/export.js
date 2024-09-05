import { post } from "@/lib/http-client";

export const exportFile = async (fileName, data) => {
  try {
    const response = await post(`/api/${fileName}/export`, data, {
      responseType: 'blob',
    });
    if (response) {
      return response;
    } else {
      throw new Error('Expected a Blob response');
    }
  } catch (error) {
    console.error('Error in exportFile:', error);
    throw error;
  }
};
