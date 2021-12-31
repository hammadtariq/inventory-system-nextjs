import { useEffect, useState } from "react";
import { verifyToken } from "@/hooks/login";
import Spinner from "./spinner";

const ProtectedRoutes = ({ children, router }) => {
  let [canViewPage, setCanViewPage] = useState(false);

  useEffect(() => {
    verifyToken()
      .then(() => {
        if (router.pathname === "/login") {
          router.push("/");
        } else {
          setCanViewPage(true);
        }
      })
      .catch(() => {
        if (router.pathname !== "/login") {
          router.push("/login");
        } else {
          setCanViewPage(true);
        }
      });

    return () => null;
  }, [canViewPage, router.pathname]);

  return canViewPage ? children : <Spinner />;
};

export default ProtectedRoutes;
