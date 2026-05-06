import { AsyncLocalStorage } from "async_hooks";

const storage = new AsyncLocalStorage();

const getStore = () => storage.getStore() || {};

const TenantContext = {
  run: (organizationId, fn) => storage.run({ ...getStore(), organizationId }, fn),

  get: () => storage.getStore()?.organizationId ?? null,

  getTransaction: () => storage.getStore()?.transaction ?? null,

  setTransaction: (transaction) => {
    const store = getStore();
    store.transaction = transaction;
    return transaction;
  },

  assertGet: () => {
    const organizationId = TenantContext.get();

    if (!organizationId) {
      throw new Error("TenantContext not set. Auth middleware may be missing on this route.");
    }

    return organizationId;
  },

  namespace: {
    run: (fn) => storage.run({ ...getStore() }, fn),
    bind:
      (fn) =>
      (...args) => {
        const store = getStore();
        return storage.run({ ...store }, () => fn(...args));
      },
    get: (key) => getStore()[key],
    set: (key, value) => {
      const store = getStore();
      store[key] = value;
    },
  },
};

export default TenantContext;
