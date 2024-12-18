import { useCallback, useEffect, useState } from "react";
import { verifyToken } from "@/hooks/login";
import Spinner from "./spinner";
import { to } from "@/utils/to.util";

const ProtectedRoutes = ({ children, router }) => {
  let [canViewPage, setCanViewPage] = useState(false);

  const verification = useCallback(async () => {
    // You can await here
    if (router.pathname !== "/login") {
      const [err] = await to(verifyToken());
      if (err) {
        router.push("/login");
        return;
      }
    }
    setCanViewPage(true);

    return () => null;
  }, [router]);

  useEffect(() => {
    verification();
  }, [verification]);

  return canViewPage ? children : <Spinner />;
};

export default ProtectedRoutes;
