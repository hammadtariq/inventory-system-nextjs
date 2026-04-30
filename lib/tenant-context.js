import { AsyncLocalStorage } from "async_hooks";

const storage = new AsyncLocalStorage();

const TenantContext = {
  run: (organizationId, fn) => storage.run({ organizationId }, fn),

  get: () => storage.getStore()?.organizationId ?? null,

  assertGet: () => {
    const organizationId = TenantContext.get();

    if (!organizationId) {
      throw new Error("TenantContext not set. Auth middleware may be missing on this route.");
    }

    return organizationId;
  },
};

export default TenantContext;
