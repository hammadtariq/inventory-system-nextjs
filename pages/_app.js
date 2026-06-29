import "@/styles/globals.css";
import Head from "next/head";
import Layout from "@/components/layout";
import ProtectedRoutes from "@/components/protectedRoutes";
import StorageUtils from "@/utils/storage.util";
import PermissionUtil from "@/utils/permission.util";
import { useEffect } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const setPermission = () => {
  const user = StorageUtils.getItem("user");
  PermissionUtil.setPermissions(user?.role ?? "EDITOR");
};

const indexablePublicRoutes = [
  "/",
  "/about",
  "/privacy",
  "/terms",
  "/inventory-management-software",
  "/inventory-accounting-software",
  "/inventory-software-south-asia",
];

export default function MyApp({ Component, pageProps, router }) {
  useEffect(() => {
    setPermission();
  }, []);
  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);
  const shouldNoindex = !indexablePublicRoutes.includes(router.pathname);

  return (
    <>
      {shouldNoindex && (
        <Head>
          <meta name="robots" content="noindex,nofollow" />
        </Head>
      )}
      <ProtectedRoutes router={router}>
        <>{getLayout(<Component {...pageProps} router={router} />)}</>
      </ProtectedRoutes>
      <SpeedInsights />
    </>
  );
}
