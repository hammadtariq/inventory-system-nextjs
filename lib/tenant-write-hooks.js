import TenantContext from "@/lib/tenant-context";

export const TENANT_MODELS = [
  "User",
  "Customer",
  "Company",
  "Inventory",
  "Purchase",
  "PurchaseHistory",
  "Sale",
  "SaleReturn",
  "Items",
  "Ledger",
  "Cheque",
];

export function applyTenantWriteHooks(Model) {
  const hasOrganizationId = () => Object.prototype.hasOwnProperty.call(Model.rawAttributes, "organizationId");

  const scopeWhere = (options = {}) => {
    if (options.tenantBypass === true || !hasOrganizationId()) return;

    const organizationId = TenantContext.assertGet();
    options.where = options.where || {};

    if (options.where.organizationId && options.where.organizationId !== organizationId) {
      throw new Error("Cross-tenant query attempted");
    }

    options.where.organizationId = organizationId;
  };

  Model.addHook("beforeFind", scopeWhere);
  Model.addHook("beforeCount", scopeWhere);
  Model.addHook("beforeBulkUpdate", scopeWhere);
  Model.addHook("beforeBulkDestroy", scopeWhere);

  Model.addHook("beforeUpdate", (instance, options = {}) => {
    if (options.tenantBypass === true || !hasOrganizationId()) return;

    const organizationId = TenantContext.assertGet();
    if (instance.organizationId && instance.organizationId !== organizationId) {
      throw new Error("Cross-tenant update attempted");
    }
  });

  Model.addHook("beforeDestroy", (instance, options = {}) => {
    if (options.tenantBypass === true || !hasOrganizationId()) return;

    const organizationId = TenantContext.assertGet();
    if (instance.organizationId && instance.organizationId !== organizationId) {
      throw new Error("Cross-tenant delete attempted");
    }
  });

  Model.addHook("beforeCreate", (instance, options = {}) => {
    if (options.tenantBypass === true || !hasOrganizationId()) return;

    const organizationId = TenantContext.assertGet();
    if (instance.organizationId && instance.organizationId !== organizationId) {
      throw new Error("Cross-tenant create attempted");
    }

    instance.organizationId = organizationId;
  });

  Model.addHook("beforeBulkCreate", (instances, options = {}) => {
    if (options.tenantBypass === true || !hasOrganizationId()) return;

    const organizationId = TenantContext.assertGet();

    instances.forEach((instance) => {
      if (instance.organizationId && instance.organizationId !== organizationId) {
        throw new Error("Cross-tenant create attempted");
      }
      instance.organizationId = organizationId;
    });
  });
}
