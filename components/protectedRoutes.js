import { useEffect, useState } from "react";
import { verifyToken } from "@/hooks/login";
import Spinner from "./spinner";
import { to } from "@/utils/to.util";

const ProtectedRoutes = ({ children, router }) => {
  let [canViewPage, setCanViewPage] = useState(false);

  useEffect(async () => {
    if (router.pathname !== "/login") {
      const [err] = await to(verifyToken());
      if (err) {
        router.push("/login");
        return;
      }
    }
    setCanViewPage(true);

    return () => null;
  }, [canViewPage, router.pathname]);

  return canViewPage ? children : <Spinner />;
};

export default ProtectedRoutes;
