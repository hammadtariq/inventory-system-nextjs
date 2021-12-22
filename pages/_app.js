import "antd/dist/antd.css";

import "@/styles/globals.css";
import Layout from "@/components/layout";
import ProtectedRoutes from "@/components/protected-routes";

export default function MyApp({ Component, pageProps, router }) {
  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);
  return (
    <ProtectedRoutes router={router}>
      <>{getLayout(<Component {...pageProps} router={router} />)}</>
    </ProtectedRoutes>
  );
}
