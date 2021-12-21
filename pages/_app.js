import "antd/dist/antd.css";

import "@/styles/globals.css";
import Layout from "@/components/layout";

export default function MyApp({ Component, pageProps, router }) {
  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);
  return getLayout(<Component {...pageProps} router={router} />);
}
