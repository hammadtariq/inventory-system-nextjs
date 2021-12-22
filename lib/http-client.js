import axios from "axios";
import { message } from "antd";
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
  function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response.data;
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error

    const errorStatus = error.response.status;
    const errorMessage = error.response.data.message;

    message.error(errorMessage);
    return Promise.reject(errorMessage);
  }
);

export const get = (url, config = {}) => axios.get(url, config);

export const remove = (url, config = {}) => axios.delete(url, config);

export const post = (url, data, config = {}) => axios.post(url, data, config);

export const put = (url, data, config = {}) => axios.put(url, data, config);
