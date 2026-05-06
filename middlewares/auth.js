import Iron from "@hapi/iron";

import db from "@/lib/postgres";
import { getTokenCookie } from "@/lib/auth-cookies";
import TenantContext from "@/lib/tenant-context";
import { resolveOrganizationScope } from "@/lib/organization-scope";

const TOKEN_SECRET = process.env.TOKEN_SECRET;

export const auth = async (req, res, next) => {
  const token = getTokenCookie(req);
  let transaction = null;
  let finalized = false;
  let finalize = null;

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

    const organization = await resolveOrganizationScope(user);
    if (!organization) {
      return res.status(401).send({ message: "Organization not found" });
    }

    if (organization.status !== "ACTIVE" && user.role !== "SUPER_ADMIN") {
      return res.status(403).send({ message: "Organization suspended" });
    }

    transaction = await db.sequelize.transaction();
    finalize = async (shouldCommit) => {
      if (finalized) return;
      finalized = true;

      try {
        if (shouldCommit) {
          await transaction.commit();
        } else {
          await transaction.rollback();
        }
      } finally {
        TenantContext.setTransaction(null);
      }
    };

    res.once("finish", () => {
      void finalize(res.statusCode < 400);
    });

    res.once("close", () => {
      void finalize(false);
    });

    await db.sequelize.query("SET LOCAL app.tenant_id = :organizationId", {
      transaction,
      replacements: { organizationId: organization.id },
    });

    req.user = user;
    req.organization = organization;

    return TenantContext.run(organization.id, () => {
      TenantContext.setTransaction(transaction);
      return next();
    });
  } catch (error) {
    console.log(error);
    if (transaction && finalize && !finalized) {
      try {
        await finalize(false);
      } catch (rollbackError) {
        console.log(rollbackError);
      }
    } else {
      TenantContext.setTransaction(null);
    }
    res.status(401).send({ message: "Authentication failed" });
  }
};
