import "antd/dist/antd.css";
import "@/styles/globals.css";
import Layout from "@/components/layout";
import ProtectedRoutes from "@/components/protectedRoutes";
import StorageUtils from "@/utils/storage.util";
import PermissionUtil from "@/utils/permission.util";
import { useEffect } from "react";

const setPermission = () => {
  const user = StorageUtils.getItem("user");
  PermissionUtil.setPermissions(user?.role ?? "EDITOR");
};

export default function MyApp({ Component, pageProps, router }) {
  useEffect(() => {
    setPermission();
  }, []);
  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);
  return (
    <ProtectedRoutes router={router}>
      <>{getLayout(<Component {...pageProps} router={router} />)}</>
    </ProtectedRoutes>
  );
}
