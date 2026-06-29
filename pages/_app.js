import "@/styles/globals.css";
import Head from "next/head";
import Layout from "@/components/layout";
import ProtectedRoutes from "@/components/protectedRoutes";
import StorageUtils from "@/utils/storage.util";
import PermissionUtil from "@/utils/permission.util";
import { useEffect } from "react";
import { Bricolage_Grotesque, Manrope } from "next/font/google";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

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
    <div className={`${bricolage.variable} ${manrope.variable}`}>
      {shouldNoindex && (
        <Head>
          <meta name="robots" content="noindex,nofollow" />
        </Head>
      )}
      <ProtectedRoutes router={router}>
        <>{getLayout(<Component {...pageProps} router={router} />)}</>
      </ProtectedRoutes>
    </div>
  );
}
