import db from "@/lib/postgres";

export const resolveOrganizationScope = async (user) => {
  if (!user?.organizationId) {
    return null;
  }

  return db.Organization.findByPk(user.organizationId, { tenantBypass: true });
};
