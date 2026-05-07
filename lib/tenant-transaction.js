import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";

export const applyTenantToTransaction = async (transaction) => {
  const organizationId = TenantContext.assertGet();
  const dialect = db.sequelize.getDialect?.();

  if (dialect && dialect !== "postgres") {
    return organizationId;
  }

  await db.sequelize.query("SET LOCAL app.tenant_id = :organizationId", {
    transaction,
    replacements: { organizationId },
  });

  return organizationId;
};

export const createTenantTransaction = async () => {
  const transaction = await db.sequelize.transaction();

  try {
    const organizationId = await applyTenantToTransaction(transaction);
    return { transaction, organizationId };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const withTenantTransaction = (options = {}) => {
  const transaction = options.transaction || TenantContext.getTransaction();

  if (!transaction) {
    return options;
  }

  return {
    ...options,
    transaction,
  };
};
