import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Breadcrumb, Layout } from "antd";
import styles from "@/styles/Content.module.css";

const { Content } = Layout;

export default function AppContent({ children }) {
  const router = useRouter();
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    if (router) {
      const linkPath = router.asPath.split("/");
      linkPath.shift();
      const pathArray = linkPath.map((item, i) => {
        return { breadcrumb: item, href: `/${linkPath.slice(0, i + 1)}/` };
      });
      setRoutes(pathArray);
    }
  }, [router]);
  return (
    <Content className={styles.content}>
      <Breadcrumb className={styles.breadcrumb}>
        {routes.map((item, index) => {
          return (
            <Breadcrumb.Item key={`${index}`} onClick={() => router.push(item.href)}>
              {item.breadcrumb.toUpperCase()}
            </Breadcrumb.Item>
          );
        })}
      </Breadcrumb>
      <div className={styles.siteLayout}>{children}</div>
    </Content>
  );
}
