import Iron from "@hapi/iron";

import db from "@/lib/postgres";
import { getTokenCookie } from "@/lib/auth-cookies";
import TenantContext from "@/lib/tenant-context";

const TOKEN_SECRET = process.env.TOKEN_SECRET;

export const auth = async (req, res, next) => {
  const token = getTokenCookie(req);

  if (!token) {
    return res.status(401).send({ message: "Please login first" });
  }

  try {
    const unsealedToken = await Iron.unseal(token, TOKEN_SECRET, Iron.defaults);

    if (unsealedToken && Date.now() > new Date(unsealedToken?.token?.maxAge)) {
      return res.status(401).send({ message: "Token expired" });
    }

    if (!unsealedToken?.user?.organizationId) {
      return res.status(401).send({ message: "Invalid token (missing organization)" });
    }

    // verify user from database
    await db.dbConnect();
    const user = await db.User.findOne({
      where: { id: unsealedToken?.user?.id },
      attributes: { exclude: ["password"] },
      tenantBypass: true,
    });
    if (!user) return res.status(401).send({ message: "User not found" });

    if (user.organizationId !== unsealedToken.user.organizationId) {
      return res.status(401).send({ message: "Token validation failed" });
    }

    const organization = await db.Organization.findByPk(user.organizationId);
    if (!organization) {
      return res.status(401).send({ message: "Organization not found" });
    }

    if (organization.status !== "ACTIVE") {
      return res.status(403).send({ message: "Organization suspended" });
    }

    req.user = user;
    req.organization = organization;

    return TenantContext.run(user.organizationId, () => next());
  } catch (error) {
    console.log(error);
    res.status(401).send({ message: "Authentication failed" });
  }
};
