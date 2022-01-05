const setItem = (key, data) => {
  if (typeof data === "string") {
    localStorage.setItem(key, data);
  } else {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

const clearStorage = () => {
  localStorage.clear();
};

const getItem = (key) => {
  return JSON.parse(localStorage.getItem(key)) ?? null;
};

const StorageUtils = {
  setItem,
  clearStorage,
  getItem,
};
export default StorageUtils;
