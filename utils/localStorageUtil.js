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
  return localStorage.getItem(key) ?? null;
};

export default {
  setItem,
  clearStorage,
  getItem,
};
