import { useEffect, useState } from "react";
import { verifyToken } from "@/hooks/login";
import Spinner from "./spinner";

const ProtectedRoutes = ({ children, router }) => {
  let [canViewPage, setCanViewPage] = useState(false);

  useEffect(() => {
    verifyToken()
      .then(() => {
        if (router.pathname !== "/login") {
          setCanViewPage(true);
          return;
        }
        router.push("/");
      })
      .catch(() => {
        if (router.pathname === "/login") {
          setCanViewPage(true);
          return;
        }
        router.push("/login");
      });

    return () => null;
  }, [canViewPage, router.pathname]);

  return canViewPage ? children : <Spinner />;
};

export default ProtectedRoutes;
