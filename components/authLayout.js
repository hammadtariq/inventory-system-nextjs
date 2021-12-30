import { Card, Col, Divider, Layout, Row } from "antd";
import Image from "next/image";
import Logo from "../public/vercel.svg";
import styles from "@/styles/AuthLayout.module.css";

export default function AuthLayout({ children }) {
  return (
    <Layout>
      <div className={styles.publicRoute}>
        <Row type="flex" gutter={24}>
          <Col xs={24} sm={24} md={16} lg={18} className={styles.leftVerticalSplit}>
            <div className={styles.logoBox}>
              <h1 className={styles.logoTitle}>Welcome to Inventory System</h1>
              {/* <Image src={Logo} alt="Picture of the author" className="logo" /> */}
            </div>
            <Divider type="vertical" orientation="center">
              &nbsp;
            </Divider>
          </Col>

          <Col xs={24} sm={24} md={8} lg={6} className={styles.rightVerticalSplit}>
            <Layout>
              <Card
                title={<Image src={Logo} className={styles.logo} alt="Picture of the company" width={130} />}
                className={styles.cardWrap}
                bordered={false}
              >
                {children}
              </Card>
            </Layout>
          </Col>
        </Row>
      </div>
    </Layout>
  );
}
