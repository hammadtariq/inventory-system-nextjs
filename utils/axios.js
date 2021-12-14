import axios from "axios";

export const axiosFetcher = (url) => axios.get(url).then((res) => res.data);
