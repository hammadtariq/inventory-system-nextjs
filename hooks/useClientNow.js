import { useSyncExternalStore } from "react";

const subscribe = (callback) => {
  callback();
  return () => {};
};

const getSnapshot = () => Date.now();
const getServerSnapshot = () => null;

export function useClientNow() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
