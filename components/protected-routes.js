import { useLayoutEffect } from "react";

import { verifyToken } from "@/hooks/login";

const ProtectedRoutes = ({ children, router }) => {
  useLayoutEffect(() => {
    if (router.pathname !== "/login") {
      verifyToken()
        .then((_) => {
          if (router.pathname === "/login") {
            router.push("/");
          }
        })
        .catch((_) => {
          router.push("/login");
        });
    }

    return () => null;
  }, [router.pathname]);

  return children;
};

export default ProtectedRoutes;
