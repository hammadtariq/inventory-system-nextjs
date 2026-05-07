import Iron from "@hapi/iron";

import db from "@/lib/postgres";
import { getTokenCookie } from "@/lib/auth-cookies";
import { resolveOrganizationScope } from "@/lib/organization-scope";

const TOKEN_SECRET = process.env.TOKEN_SECRET;

const buildRedirect = (destination = "/login") => ({
  redirect: {
    destination,
    permanent: false,
  },
});

export const getAuthenticatedUser = async (context) => {
  const token = getTokenCookie(context.req);
  if (!token) return null;

  const unsealedToken = await Iron.unseal(token, TOKEN_SECRET, Iron.defaults);
  if (!unsealedToken?.user?.id) return null;

  if (unsealedToken && Date.now() > new Date(unsealedToken?.token?.maxAge)) {
    return null;
  }

  await db.dbConnect();
  const user = await db.User.findOne({
    where: { id: unsealedToken.user.id },
    attributes: { exclude: ["password"] },
    tenantBypass: true,
  });

  if (!user) return null;

  const organization = await resolveOrganizationScope(user);

  if (!organization) return null;

  return { user, organization, token: unsealedToken };
};

export const requirePageRole = async (context, allowedRoles) => {
  const session = await getAuthenticatedUser(context);

  if (!session) {
    return buildRedirect();
  }

  if (!allowedRoles.includes(session.user.role)) {
    return buildRedirect();
  }

  return {
    props: {
      currentUser: {
        id: session.user.id,
        uuid: session.user.uuid,
        fisrtName: session.user.firstName,
        lastName: session.user.lastName,
        email: session.user.email,
        role: session.user.role,
        organizationId: session.user.organizationId,
        organizationUuid: session.organization.uuid,
        organizationSlug: session.organization.slug,
      },
    },
  };
};
