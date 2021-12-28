import { useEffect } from "react";

import { verifyToken } from "@/hooks/login";
import permissionsUtil from "@/utils/permission.util";

const ProtectedRoutes = ({ children, router }) => {
  const setPermission = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      permissionsUtil.setPermissions(user.role);
    } catch (e) {
      console.log(e);
    }
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
