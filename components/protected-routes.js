import { useEffect } from "react";

import { verifyToken } from "@/hooks/login";
import permissionsUtil from "@/utils/permission.util";
import localStorageUtil from "@/utils/localStorageUtil";

const ProtectedRoutes = ({ children, router }) => {
  const setPermission = () => {
    const user = JSON.parse(localStorageUtil.getItem("user"));
    permissionsUtil.setPermissions(user?.role ?? "EDITOR");
  };

  useEffect(() => {
    verifyToken()
      .then((_) => {
        setPermission();
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
