import { useEffect, useState } from "react";
import { verifyToken } from "@/hooks/login";
import Spinner from "./spinner";
import { to } from "@/utils/to.util";

const publicRoutes = ["/login", "/accept-invite"];

const ProtectedRoutes = ({ children, router }) => {
  const [canViewPage, setCanViewPage] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (["/login", "/landing", "/about", "/privacy", "/terms"].includes(router.pathname)) {
        setCanViewPage(true);
        return;
      }

      const [err] = await to(verifyToken());
      if (err) {
        console.error("Token expired or invalid:", err);
        router.push("/login");
        return;
      }

      setCanViewPage(true);
    };

    checkAccess();
  }, [router, router.pathname]);

  return canViewPage ? children : <Spinner />;
};

export default ProtectedRoutes;
