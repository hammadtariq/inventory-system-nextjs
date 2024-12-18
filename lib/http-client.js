import { message } from "antd";
import axios from "axios";

// Add a request interceptor
axios.interceptors.request.use(
  function (config) {
    // Do something before request is sent
    return config;
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  }
);

// Add a response interceptor
axios.interceptors.response.use(
  (response) => {
    // Handle successful response
    return response.data;
  },
  (error) => {
    // Handle error response
    // const errorStatus = error.response.status;
    let errorMessage;
    if (!error.response) {
      message.error("Internal Server Error");
      return Promise.reject("Internal Server Error");
    } else if (error.response.data instanceof Blob) {
      // Handle Blob error response
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result;
        errorMessage = JSON.parse(text)?.message || "Error processing file";
        message.error(errorMessage);
      };
      reader.readAsText(error.response.data);
    } else {
      // Handle regular error response
      errorMessage = error.response?.data?.message || "An error occurred";
      message.error(errorMessage);
    }

    return Promise.reject(errorMessage);
  }
);

export const get = (url, config = {}) => axios.get(url, config);

export const remove = (url, config = {}) => axios.delete(url, config);

export const post = (url, data, config = {}) => axios.post(url, data, config);

export const put = (url, data, config = {}) => axios.put(url, data, config);
