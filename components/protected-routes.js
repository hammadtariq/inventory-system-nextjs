import { useEffect } from "react";

import { verifyToken } from "@/hooks/login";

const ProtectedRoutes = ({ children, router }) => {
  useEffect(() => {
    verifyToken()
      .then((_) => {
        if (router.pathname === "/login") {
          router.push("/");
        }
      })
      .catch((_) => {
        router.push("/login");
      });

    return () => null;
  }, [router.pathname]);

  return children;
};

export default ProtectedRoutes;
