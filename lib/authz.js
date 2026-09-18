export class AuthzError extends Error {
  constructor(message = "Operation not permitted.") {
    super(message);
    this.name = "AuthzError";
    this.status = 403;
  }
}

export function requireRole(...allowedRoles) {
  return function (user) {
    if (!allowedRoles.includes(user.role)) {
      throw new AuthzError();
    }
  };
}

// eslint-disable-next-line no-unused-vars
export function onError(err, _req, res, _next) {
  if (err instanceof AuthzError) {
    return res.status(403).json({ message: err.message });
  }
  console.error(err);
  return res.status(500).json({ message: err.message ?? "Internal server error" });
}
