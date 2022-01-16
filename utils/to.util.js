export const to = (promise) =>
  promise
    .then((data) => {
      return [null, data];
    })
    .catch((err) => [err]);

export const throwError = (errMsg, log) => {
  if (log === true) {
    console.error(errMsg);
  }
  throw new Error(errMsg);
};
