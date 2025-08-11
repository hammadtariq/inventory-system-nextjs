import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import _isEmpty from "lodash/isEmpty";
import { Alert, Empty, Radio, Row, Col } from "antd";
import { useLedger } from "@/hooks/ledger";
import styles from "@/styles/Ledger.module.css";
import AppTitle from "@/components/title";
import AppCreateButton from "@/components/createButton";
import { comaSeparatedValues } from "@/utils/comaSeparatedValues";
import Spinner from "@/components/spinner";

const Ledger = () => {
  const router = useRouter();
  const { query } = router;
  const [type, setType] = useState(!_isEmpty(query.type) ? query.type : "company");
  const { transactions, totalBalance, error, isLoading } = useLedger(type);

  useEffect(() => {
    router.push(
      {
        pathname: "/ledger",
        query: { type },
      },
      undefined,
      { shallow: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (e) => {
    setType(e.target.value);
  };

  if (error) return <Alert message={error} type="error" />;
  if (isLoading) return <Spinner />;

  return (
    <div>
      <AppTitle level={2}>
        Ledger
        <AppCreateButton url="/ledger/create" />
      </AppTitle>

      <Row gutter={[15, 15]} align="space-between" style={{ marginBottom: 25 }}>
        <Col sm={12} xs={24}>
          {transactions && transactions.length > 0 ? (
            <div>
              <strong className={styles.headingStyle}>Total Balance (RS):</strong>
              <span className={styles.contentStyle}>{comaSeparatedValues(totalBalance)}</span>
            </div>
          ) : null}
        </Col>

        <Col sm={12} xs={24} className={styles.companySelection}>
          <Radio.Group onChange={onChange} defaultValue="company" value={type}>
            <Radio value="company">Company</Radio>
            <Radio value="customer">Customer</Radio>
          </Radio.Group>
        </Col>
      </Row>
      {transactions && transactions.length > 0 ? (
        <Row gutter={[15, 15]}>
          {transactions
            ? transactions.map((item, index) => {
                return (
                  <Col xs={24} md={12} lg={6} key={index}>
                    <div
                      onClick={() => (window.location.href = `/ledger/${item.id}?type=${type}`)}
                      style={{
                        cursor: "pointer",
                        borderRadius: "20px",
                        background: "#fff",
                        padding: "24px",
                        minHeight: "160px",
                        boxShadow: "0 8px 24px rgba(173, 173, 173, 0.3)",
                        transition: "transform 0.2s ease, box-shadow 0.3s ease",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        textAlign: "center",
                        margin: "20px 0 20px 0",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 12px 32px rgba(99, 149, 255, 0.30)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(173, 173, 173, 0.3)";
                      }}
                    >
                      {/* Card Header */}
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: "600",
                          color: "black",
                          padding: "12px",
                          borderRadius: "10px",
                          marginTop: "-50px",
                          boxShadow: "0 4px 12px rgba(173, 173, 173, 0.2), 0 -4px 8px rgba(173, 173, 173, 0.1)",
                          backgroundColor: "#fff",
                        }}
                      >
                        {item.name}
                      </div>

                      <div style={{ height: "1px", backgroundColor: "#d4e2ffff", margin: "16px 0" }} />

                      {/* Card Content */}
                      <div>
                        <div style={{ fontSize: "14px", color: "#818181ff", marginBottom: "4px" }}>Total Balance</div>
                        <div style={{ fontSize: "24px", fontWeight: "700", color: "#6395ff" }}>
                          {`${comaSeparatedValues(item.total.toFixed(2))}`}
                        </div>
                      </div>
                    </div>
                  </Col>
                );
              })
            : null}
        </Row>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  );
};

export default Ledger;
