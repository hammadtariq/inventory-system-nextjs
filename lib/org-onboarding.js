import crypto from "crypto";
import Iron from "@hapi/iron";

import { MAX_AGE, setTokenCookie } from "@/lib/auth-cookies";

const TOKEN_SECRET = process.env.TOKEN_SECRET;
const INVITE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const normalizeSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

export const createInviteToken = () => crypto.randomBytes(32).toString("hex");

export const hashInviteToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

export const getInviteExpiry = () => new Date(Date.now() + INVITE_MAX_AGE_MS);

export const getAppOrigin = (req) => {
  const proto = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers.host || "localhost:3000";
  return `${proto}://${host}`;
};

export const buildInviteUrl = (req, token) => `${getAppOrigin(req)}/accept-invite?token=${token}`;

export const sealLoginToken = async ({ user, organization }) => {
  const tokenPayload = {
    user: {
      id: user.id,
      uuid: user.uuid,
      fisrtName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      organizationUuid: organization.uuid,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    token: {
      maxAge: new Date(Date.now() + MAX_AGE * 1000),
    },
  };

  return Iron.seal(tokenPayload, TOKEN_SECRET, Iron.defaults);
};

export const setLoginSession = async (res, { user, organization }) => {
  const sealedToken = await sealLoginToken({ user, organization });
  setTokenCookie(res, sealedToken);
  return sealedToken;
};
