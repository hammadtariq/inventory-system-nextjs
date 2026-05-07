import db from "@/lib/postgres";

const parseOrganizationId = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const getRequestedOrganizationId = (req) => {
  const headerValue = req?.headers?.["x-organization-id"];

  if (Array.isArray(headerValue)) {
    return parseOrganizationId(headerValue[0]);
  }

  return parseOrganizationId(headerValue);
};

export const resolveOrganizationScope = async (user, requestedOrganizationId = null) => {
  if (!user?.organizationId) {
    return null;
  }

  const organizationId =
    user.role === "SUPER_ADMIN" && requestedOrganizationId ? requestedOrganizationId : user.organizationId;

  return db.Organization.findByPk(organizationId, { tenantBypass: true });
};
