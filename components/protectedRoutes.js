import { useEffect, useState } from "react";
import { verifyToken } from "@/hooks/login";
import Spinner from "./spinner";
import { to } from "@/utils/to.util";

const publicRoutes = new Set([
  "/",
  "/login",
  "/checkout",
  "/accept-invite",
  "/about",
  "/privacy",
  "/terms",
  "/inventory-management-software",
  "/inventory-accounting-software",
  "/inventory-software-south-asia",
]);

const ProtectedRoutes = ({ children, router }) => {
  const isPublicRoute = publicRoutes.has(router.pathname);
  const [verifiedPath, setVerifiedPath] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (isPublicRoute) {
        return;
      }

      setVerifiedPath(null);
      const [err] = await to(verifyToken());
      if (err) {
        console.error("Token expired or invalid:", err);
        const nextPath = router.asPath || router.pathname;
        router.push(`/login?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      setVerifiedPath(router.pathname);
    };

    checkAccess();
  }, [isPublicRoute, router, router.pathname]);

  return isPublicRoute || verifiedPath === router.pathname ? children : <Spinner />;
};

export default ProtectedRoutes;
